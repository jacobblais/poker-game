import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import { nextActivePlayerIndex } from '@/lib/gameEngine';

interface Params { params: Promise<{ roomId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room || !room.gameState) return NextResponse.json({ error: 'No game' }, { status: 404 });

  const { playerId, cardIndices } = await req.json();
  const state = room.gameState;
  const deck = [...state.deck];

  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newHand = p.holeCards.map((c, i) => {
      if ((cardIndices as number[]).includes(i)) {
        const newCard = deck.pop()!;
        newCard.faceUp = true;
        return newCard;
      }
      return c;
    });
    return { ...p, holeCards: newHand };
  });

  const nextIdx = nextActivePlayerIndex({ ...state, players }, state.currentPlayerIndex);
  const next = { ...state, deck, players, currentPlayerIndex: nextIdx };
  await setRoom({ ...room, gameState: next });
  return NextResponse.json({ ok: true });
}
