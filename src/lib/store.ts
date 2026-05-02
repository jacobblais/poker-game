// In-memory store for Vercel serverless (use KV/Redis in production)
import { GameRoom, GameState, RoomPlayer } from '@/lib/types';

// Global store (persists within same serverless instance)
const rooms = new Map<string, GameRoom>();
const chatHistory = new Map<string, Array<{ id: string; playerId: string; playerName: string; message: string; ts: number }>>();

export function getRoom(id: string): GameRoom | undefined {
  return rooms.get(id);
}

export function setRoom(room: GameRoom): void {
  rooms.set(room.id, room);
}

export function updateRoom(id: string, updates: Partial<GameRoom>): void {
  const room = rooms.get(id);
  if (room) {
    rooms.set(id, { ...room, ...updates });
  }
}

export function getRooms(): GameRoom[] {
  return Array.from(rooms.values());
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}

export function getChat(roomId: string) {
  return chatHistory.get(roomId) ?? [];
}

export function addChat(roomId: string, msg: { id: string; playerId: string; playerName: string; message: string; ts: number }) {
  const hist = chatHistory.get(roomId) ?? [];
  hist.push(msg);
  // Keep last 100 messages
  if (hist.length > 100) hist.splice(0, hist.length - 100);
  chatHistory.set(roomId, hist);
}
