import { NextRequest, NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/store';
import {
  applyAction, isBettingRoundComplete, collectBets,
  dealCommunityCards, dealStudCard, doShowdown, nextActivePlayerIndex,
  getActivePlayers
} from '@/lib/gameEngine';
import { GameState } from '@/lib/types';

interface Params { params: Promise<{ roomId: string }> }

function advancePhase(state: GameState): GameState {
  const active = getActivePlayers(state);
  if (active.length === 1) return doShowdown(collectBets(state));

  let next = collectBets(state);
  const v = state.variant;

  if (v === 'texas_holdem' || v === 'omaha' || v === 'omaha_hilo') {
    switch (state.phase) {
      case 'preflop': next = dealCommunityCards(next, 3); next = { ...next, phase: 'flop' }; break;
      case 'flop':   next = dealCommunityCards(next, 1); next = { ...next, phase: 'turn' }; break;
      case 'turn':   next = dealCommunityCards(next, 1); next = { ...next, phase: 'river' }; break;
      case 'river':  next = doShowdown(next); break;
    }
  } else if (v === 'five_draw') {
    if (state.phase === 'preflop') next = { ...next, phase: 'draw', drawRound: 1 };
    else if (state.phase === 'draw') next = { ...next, phase: 'river' };
    else next = doShowdown(next);
  } else {
    const street = state.studStreet ?? 3;
    if (street < 7) {
      next = dealStudCard(next);
      next = { ...next, phase: street >= 6 ? 'river' : 'flop' };
    } else {
      next = doShowdown(next);
    }
  }

  if (next.phase !== 'ended') {
    const startIdx = nextActivePlayerIndex(next, next.dealerIndex);
    next = { ...next, currentPlayerIndex: startIdx };
  }
  return next;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room || !room.gameState) return NextResponse.json({ error: 'No active game' }, { status: 404 });

  const { playerId, action, amount } = await req.json();
  const state = room.gameState;

  // Verify it's this player's turn
  const current = state.players[state.currentPlayerIndex];
  if (!current || current.id !== playerId) {
    return NextResponse.json({ error: 'Not your turn' }, { status: 400 });
  }

  let next = applyAction(state, playerId, action, amount);
  if (isBettingRoundComplete(next)) {
    next = advancePhase(next);
  }

  await setRoom({ ...room, gameState: next });
  return NextResponse.json({ ok: true });
}
