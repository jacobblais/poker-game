// src/lib/store.ts
import { GameRoom } from '@/lib/types';
import { kv } from '@vercel/kv';

// Fallback in-memory store for local development if KV is not configured
const memoryRooms = new Map<string, GameRoom>();
const memoryChat = new Map<string, any[]>();

const IS_KV_ENABLED = !!process.env.KV_REST_API_URL;

export async function getRoom(id: string): Promise<GameRoom | undefined> {
  if (IS_KV_ENABLED) {
    return (await kv.get<GameRoom>(`room:${id}`)) || undefined;
  }
  return memoryRooms.get(id);
}

export async function setRoom(room: GameRoom): Promise<void> {
  if (IS_KV_ENABLED) {
    await kv.set(`room:${room.id}`, room, { ex: 3600 * 24 }); // Expire after 24h
    // Keep a list of active rooms
    await kv.sadd('active_rooms', room.id);
  } else {
    memoryRooms.set(room.id, room);
  }
}

export async function updateRoom(id: string, updates: Partial<GameRoom>): Promise<void> {
  const room = await getRoom(id);
  if (room) {
    await setRoom({ ...room, ...updates });
  }
}

export async function getRooms(): Promise<GameRoom[]> {
  if (IS_KV_ENABLED) {
    const ids = await kv.smembers('active_rooms');
    const rooms = await Promise.all(ids.map(id => getRoom(id)));
    return rooms.filter((r): r is GameRoom => !!r);
  }
  return Array.from(memoryRooms.values());
}

export async function deleteRoom(id: string): Promise<void> {
  if (IS_KV_ENABLED) {
    await kv.del(`room:${id}`);
    await kv.srem('active_rooms', id);
    await kv.del(`chat:${id}`);
  } else {
    memoryRooms.delete(id);
    memoryChat.delete(id);
  }
}

export async function getChat(roomId: string): Promise<any[]> {
  if (IS_KV_ENABLED) {
    return (await kv.get<any[]>(`chat:${roomId}`)) ?? [];
  }
  return memoryChat.get(roomId) ?? [];
}

export async function addChat(roomId: string, msg: any): Promise<void> {
  const hist = await getChat(roomId);
  hist.push(msg);
  if (hist.length > 100) hist.splice(0, hist.length - 100);
  
  if (IS_KV_ENABLED) {
    await kv.set(`chat:${roomId}`, hist, { ex: 3600 * 24 });
  } else {
    memoryChat.set(roomId, hist);
  }
}
