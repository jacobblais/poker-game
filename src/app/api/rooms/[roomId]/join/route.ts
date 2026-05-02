import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { RoomPlayer } from '@/lib/types';

interface Params { params: Promise<{ roomId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.isStarted) return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  if (room.players.length >= room.maxPlayers) return NextResponse.json({ error: 'Room full' }, { status: 400 });

  const { playerId, playerName, chips } = await req.json();
  if (room.players.find(p => p.id === playerId)) {
    return NextResponse.json({ ok: true }); // already in room
  }

  const player: RoomPlayer = {
    id: playerId,
    name: playerName,
    chips: chips ?? room.buyIn,
    isBot: false,
    isReady: true,
  };

  await setRoom({ ...room, players: [...room.players, player] });
  return NextResponse.json({ ok: true });
}
