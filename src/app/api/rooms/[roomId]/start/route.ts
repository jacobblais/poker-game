import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { createDeck, shuffleDeck } from '@/lib/cards';
import { GameState, Player } from '@/lib/types';
import { dealHoleCards, postBlinds } from '@/lib/gameEngine';

interface Params { params: Promise<{ roomId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { roomId } = await params;
  const room = await getRoom(roomId);

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.isStarted) return NextResponse.json({ error: 'Already started' }, { status: 400 });

  // Map room players to game players
  const players: Player[] = room.players.map((p, i) => ({
    id: p.id,
    name: p.name,
    chips: p.chips,
    holeCards: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    isAllIn: false,
    hasActed: false,
    isBot: p.isBot,
    botDifficulty: p.botDifficulty,
    seatIndex: i,
    isDealer: i === 0,
    isBigBlind: false,
    isSmallBlind: false,
    avatar: p.isBot ? '🤖' : '🧑',
  }));

  let initial: GameState = {
    id: uuidv4(),
    variant: room.variant,
    phase: 'waiting',
    players,
    deck: shuffleDeck(createDeck()),
    communityCards: [],
    pots: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlind: room.smallBlind,
    bigBlind: room.bigBlind,
    currentBet: 0,
    lastRaiseAmount: room.bigBlind,
    handNumber: 1,
    actionCount: 0,
  };

  // Start hand
  initial = dealHoleCards(initial);
  if (['texas_holdem', 'omaha', 'omaha_hilo', 'five_draw'].includes(initial.variant)) {
    initial = postBlinds(initial);
    initial.phase = 'preflop';
  } else {
    initial.phase = 'preflop';
    initial.currentBet = initial.smallBlind;
  }

  await updateRoom(roomId, { isStarted: true, gameState: initial });

  return NextResponse.json({ success: true });
}
