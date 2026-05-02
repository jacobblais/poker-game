import { NextRequest, NextResponse } from 'next/server';
import { getRoom, getChat } from '@/lib/store';

interface Params { params: Promise<{ roomId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({
    gameState: room.gameState ?? null,
    chat: await getChat(roomId),
    players: room.players,
    isStarted: room.isStarted,
  });
}
