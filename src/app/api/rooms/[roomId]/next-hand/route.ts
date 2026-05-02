import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { initNewHand, dealHoleCards, postBlinds } from '@/lib/gameEngine';

interface Params { params: Promise<{ roomId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = getRoom(roomId);
  if (!room || !room.gameState) return NextResponse.json({ error: 'No game' }, { status: 404 });

  let next = initNewHand(room.gameState);
  next = dealHoleCards(next);
  if (['texas_holdem', 'omaha', 'omaha_hilo', 'five_draw'].includes(next.variant)) {
    next = postBlinds(next);
    next = { ...next, phase: 'preflop' };
  } else {
    next = { ...next, phase: 'preflop', currentBet: next.smallBlind };
  }

  setRoom({ ...room, gameState: next });
  return NextResponse.json({ ok: true });
}
