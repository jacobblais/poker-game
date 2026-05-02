import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom, addChat } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

interface Params { params: Promise<{ roomId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = getRoom(roomId);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const { playerId, playerName, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

  addChat(roomId, {
    id: uuidv4(),
    playerId,
    playerName,
    message: message.slice(0, 200),
    ts: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
