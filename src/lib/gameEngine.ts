import { Card, createDeck, shuffleDeck } from './cards';
import {
  GameState, Player, Pot, WinnerInfo, GamePhase, PlayerAction, PokerVariant
} from './types';
import {
  evaluateHand, evaluateLowHand, compareHands, compareLowHands, HandResult
} from './handEvaluator';

// ─── Utility ─────────────────────────────────────────────────────────────────

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter(p => !p.folded);
}

export function getPlayersInHand(state: GameState): Player[] {
  return state.players.filter(p => !p.folded || p.isAllIn);
}

export function nextActivePlayerIndex(state: GameState, from: number): number {
  const n = state.players.length;
  let idx = (from + 1) % n;
  let count = 0;
  while ((state.players[idx].folded || state.players[idx].isAllIn) && count < n) {
    idx = (idx + 1) % n;
    count++;
  }
  return idx;
}

export function buildSidePots(players: Player[]): Pot[] {
  const active = players.filter(p => p.totalBet > 0);
  if (!active.length) return [];
  const sorted = [...active].sort((a, b) => a.totalBet - b.totalBet);
  const pots: Pot[] = [];
  let prev = 0;
  for (const player of sorted) {
    if (player.totalBet <= prev) continue;
    const level = player.totalBet;
    const amount = (level - prev) * players.filter(p => p.totalBet >= level).length;
    const eligible = players.filter(p => p.totalBet >= level && !p.folded).map(p => p.id);
    if (eligible.length === 0) continue;
    pots.push({ amount, eligiblePlayerIds: eligible });
    prev = level;
  }
  return pots;
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export function dealHoleCards(state: GameState): GameState {
  const deck = [...state.deck];
  const players = state.players.map(p => ({ ...p, holeCards: [] as Card[], folded: false, bet: 0, totalBet: 0, isAllIn: false, hasActed: false, handResult: undefined, lowHandResult: undefined }));

  const count = holeCardCount(state.variant);
  for (let i = 0; i < count; i++) {
    for (const p of players) {
      const card = deck.pop()!;
      // For stud games, alternate face-up/face-down
      if (state.variant === 'seven_stud' || state.variant === 'seven_stud_hilo' || state.variant === 'razz') {
        card.faceUp = i >= 2; // first 2 down, rest up (except last)
      } else {
        card.faceUp = false;
      }
      p.holeCards.push(card);
    }
  }

  return { ...state, deck, players, communityCards: [] };
}

export function holeCardCount(variant: PokerVariant): number {
  switch (variant) {
    case 'texas_holdem': return 2;
    case 'omaha': case 'omaha_hilo': return 4;
    case 'seven_stud': case 'seven_stud_hilo': case 'razz': return 3;
    case 'five_draw': return 5;
  }
}

export function dealCommunityCards(state: GameState, count: number): GameState {
  const deck = [...state.deck];
  const newCards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = deck.pop()!;
    card.faceUp = true;
    newCards.push(card);
  }
  return { ...state, deck, communityCards: [...state.communityCards, ...newCards] };
}

// Deal additional stud card (face up, except last which is face down)
export function dealStudCard(state: GameState): GameState {
  const deck = [...state.deck];
  const street = (state.studStreet ?? 3);
  const players = state.players.map(p => {
    if (p.folded) return p;
    const card = deck.pop()!;
    card.faceUp = street < 7; // 7th street is face down
    return { ...p, holeCards: [...p.holeCards, card] };
  });
  return { ...state, deck, players, studStreet: street + 1 };
}

// ─── Post Blinds ──────────────────────────────────────────────────────────────

export function postBlinds(state: GameState): GameState {
  const players = [...state.players];
  const n = players.length;
  const sbIdx = (state.dealerIndex + 1) % n;
  const bbIdx = (state.dealerIndex + 2) % n;

  players[sbIdx] = { ...players[sbIdx], isSmallBlind: true, isDealer: false };
  players[bbIdx] = { ...players[bbIdx], isBigBlind: true };

  // Post SB
  const sbAmount = Math.min(state.smallBlind, players[sbIdx].chips);
  players[sbIdx] = {
    ...players[sbIdx],
    chips: players[sbIdx].chips - sbAmount,
    bet: sbAmount,
    totalBet: sbAmount,
    isAllIn: players[sbIdx].chips === 0,
  };

  // Post BB
  const bbAmount = Math.min(state.bigBlind, players[bbIdx].chips);
  players[bbIdx] = {
    ...players[bbIdx],
    chips: players[bbIdx].chips - bbAmount,
    bet: bbAmount,
    totalBet: bbAmount,
    isAllIn: players[bbIdx].chips === 0,
  };

  // Action starts after BB (UTG)
  const startIdx = (bbIdx + 1) % n;

  return {
    ...state,
    players,
    currentBet: state.bigBlind,
    currentPlayerIndex: startIdx,
    actionCount: 0,
    pots: [{ amount: 0, eligiblePlayerIds: players.map(p => p.id) }],
  };
}

// ─── Apply Action ────────────────────────────────────────────────────────────

export function applyAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
  raiseAmount?: number
): GameState {
  const idx = state.players.findIndex(p => p.id === playerId);
  if (idx === -1) return state;
  let players = [...state.players];
  let player = { ...players[idx] };
  let currentBet = state.currentBet;
  let lastRaiseAmount = state.lastRaiseAmount;

  const callAmount = Math.max(0, currentBet - player.bet);

  switch (action) {
    case 'fold':
      player = { ...player, folded: true };
      break;
    case 'check':
      // Only valid if no bet to call
      break;
    case 'call': {
      const amount = Math.min(callAmount, player.chips);
      player = {
        ...player,
        chips: player.chips - amount,
        bet: player.bet + amount,
        totalBet: player.totalBet + amount,
        isAllIn: player.chips - amount === 0,
      };
      break;
    }
    case 'raise': {
      const amount = Math.min(raiseAmount ?? currentBet * 2, player.chips);
      const total = amount;
      lastRaiseAmount = total - callAmount;
      currentBet = player.bet + total;
      player = {
        ...player,
        chips: player.chips - total,
        bet: player.bet + total,
        totalBet: player.totalBet + total,
        isAllIn: player.chips - total === 0,
      };
      break;
    }
    case 'all_in': {
      const amount = player.chips;
      const newBet = player.bet + amount;
      if (newBet > currentBet) {
        lastRaiseAmount = newBet - currentBet;
        currentBet = newBet;
      }
      player = {
        ...player,
        chips: 0,
        bet: newBet,
        totalBet: player.totalBet + amount,
        isAllIn: true,
      };
      break;
    }
  }

  player.hasActed = true;
  players[idx] = player;

  const nextIdx = nextActivePlayerIndex({ ...state, players }, idx);

  return {
    ...state,
    players,
    currentBet,
    lastRaiseAmount,
    currentPlayerIndex: nextIdx,
    actionCount: state.actionCount + 1,
    lastAction: { playerId, action, amount: raiseAmount },
  };
}

// ─── Betting Round Complete ───────────────────────────────────────────────────

export function isBettingRoundComplete(state: GameState): boolean {
  const active = state.players.filter(p => !p.folded && !p.isAllIn);
  
  // Round is complete if:
  // 1. No active players can act
  if (active.length === 0) return true;
  
  // 2. Only one player can act, and they have acted or don't need to (e.g. they called an all-in)
  // Actually, standard rule: bets must be equal AND everyone had a chance to act.
  const allCalled = active.every(p => p.bet === state.currentBet);
  const everyoneActed = active.every(p => p.hasActed);
  
  // Special case: Pre-flop big blind hasn't acted yet but bets are equal
  if (state.phase === 'preflop' && state.actionCount < state.players.length && state.currentBet === state.bigBlind) {
      // Big blind still gets their option
      return false;
  }

  return allCalled && (everyoneActed || active.length <= 1);
}

export function collectBets(state: GameState): GameState {
  const players = state.players.map(p => ({ ...p, bet: 0, hasActed: false }));
  const pots = buildSidePots(state.players);
  return { ...state, players, pots, currentBet: 0, lastRaiseAmount: state.bigBlind, actionCount: 0 };
}

// ─── Showdown ────────────────────────────────────────────────────────────────

export function doShowdown(state: GameState): GameState {
  const active = state.players.filter(p => !p.folded);
  const variant = state.variant;

  // Evaluate all hands
  const players = state.players.map(p => {
    if (p.folded || p.holeCards.length === 0) return p;
    let handResult: HandResult | undefined;
    let lowHandResult: HandResult | undefined;

    if (variant === 'texas_holdem' || variant === 'seven_stud' || variant === 'seven_stud_hilo') {
      handResult = evaluateHand([...p.holeCards, ...state.communityCards]);
    } else if (variant === 'omaha' || variant === 'omaha_hilo') {
      handResult = evaluateOmahaHand(p.holeCards, state.communityCards);
      if (variant === 'omaha_hilo') {
        lowHandResult = evaluateOmahaLow(p.holeCards, state.communityCards);
      }
    } else if (variant === 'five_draw') {
      handResult = evaluateHand(p.holeCards);
    } else if (variant === 'razz') {
      lowHandResult = evaluateLowHand(p.holeCards);
    }

    return { ...p, handResult, lowHandResult };
  });

  // Determine winners per pot
  const winners: WinnerInfo[] = [];
  const finalPots = buildSidePots(state.players);
  if (finalPots.length === 0 && state.pots.length > 0) finalPots.push(...state.pots);

  for (const pot of finalPots) {
    if (pot.amount === 0) continue;
    const eligible = players.filter(p => pot.eligiblePlayerIds.includes(p.id) && !p.folded);
    if (eligible.length === 0) continue;

    if (variant === 'razz') {
      const potWinners = determineLowWinners(eligible);
      const share = Math.floor(pot.amount / potWinners.length);
      for (const w of potWinners) {
        winners.push({ playerId: w.id, playerName: w.name, potAmount: share, handName: w.lowHandResult?.name ?? 'Low Hand' });
      }
    } else if (variant === 'omaha_hilo' || variant === 'seven_stud_hilo') {
      // Split pot: high and low
      const highWinners = determineHighWinners(eligible);
      const lowEligible = eligible.filter(p => p.lowHandResult && p.lowHandResult.rankValue >= 0 && p.lowHandResult.tiebreakers.length > 0);

      if (lowEligible.length > 0) {
        const lowWinners = determineLowWinners(lowEligible);
        const halfPot = Math.floor(pot.amount / 2);
        const highShare = Math.floor(halfPot / highWinners.length);
        const lowShare = Math.floor(halfPot / lowWinners.length);
        for (const w of highWinners) {
          winners.push({ playerId: w.id, playerName: w.name, potAmount: highShare, handName: w.handResult?.name ?? 'High Hand' });
        }
        for (const w of lowWinners) {
          winners.push({ playerId: w.id, playerName: w.name, potAmount: lowShare, handName: w.lowHandResult?.name ?? 'Low Hand', isLow: true });
        }
      } else {
        // No qualifying low: high hand takes all
        const share = Math.floor(pot.amount / highWinners.length);
        for (const w of highWinners) {
          winners.push({ playerId: w.id, playerName: w.name, potAmount: share, handName: w.handResult?.name ?? 'High Hand' });
        }
      }
    } else {
      const potWinners = determineHighWinners(eligible);
      const share = Math.floor(pot.amount / potWinners.length);
      for (const w of potWinners) {
        winners.push({ playerId: w.id, playerName: w.name, potAmount: share, handName: w.handResult?.name ?? 'Hand' });
      }
    }
  }

  // Award chips
  const updatedPlayers = players.map(p => {
    const winAmount = winners.filter(w => w.playerId === p.id).reduce((sum, w) => sum + w.potAmount, 0);
    return { ...p, chips: p.chips + winAmount };
  });

  return { ...state, players: updatedPlayers, winners, phase: 'ended' };
}

function determineHighWinners(players: Player[]): Player[] {
  let best: Player[] = [];
  for (const p of players) {
    if (!p.handResult) continue;
    if (best.length === 0) { best = [p]; continue; }
    const cmp = compareHands(p.handResult, best[0].handResult!);
    if (cmp > 0) best = [p];
    else if (cmp === 0) best.push(p);
  }
  return best.length ? best : players.slice(0, 1);
}

function determineLowWinners(players: Player[]): Player[] {
  let best: Player[] = [];
  for (const p of players) {
    if (!p.lowHandResult || p.lowHandResult.tiebreakers.length === 0) continue;
    if (best.length === 0) { best = [p]; continue; }
    const cmp = compareLowHands(p.lowHandResult, best[0].lowHandResult!);
    if (cmp > 0) best = [p];
    else if (cmp === 0) best.push(p);
  }
  return best.length ? best : players.slice(0, 1);
}

// ─── Omaha-specific evaluation ───────────────────────────────────────────────

function evaluateOmahaHand(holeCards: Card[], communityCards: Card[]): HandResult {
  // Must use exactly 2 hole cards and 3 community cards
  let best: HandResult | null = null;
  const holeCombos = getCombinations(holeCards, 2);
  const commCombos = getCombinations(communityCards, 3);
  for (const hc of holeCombos) {
    for (const cc of commCombos) {
      const result = evaluateHand([...hc, ...cc]);
      if (!best || compareHands(result, best) > 0) best = result;
    }
  }
  return best ?? evaluateHand(holeCards.slice(0, 5));
}

function evaluateOmahaLow(holeCards: Card[], communityCards: Card[]): HandResult {
  let best: HandResult | null = null;
  const holeCombos = getCombinations(holeCards, 2);
  const commCombos = getCombinations(communityCards, 3);
  for (const hc of holeCombos) {
    for (const cc of commCombos) {
      const result = evaluateLowHand([...hc, ...cc]);
      if (!best || compareLowHands(result, best) > 0) best = result;
    }
  }
  return best ?? evaluateLowHand(holeCards.slice(0, 5));
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...getCombinations(rest, k - 1).map(c => [first, ...c]),
    ...getCombinations(rest, k),
  ];
}

// ─── New Hand ─────────────────────────────────────────────────────────────────

export function initNewHand(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  const n = state.players.length;
  const dealerIndex = (state.dealerIndex + 1) % n;

  const players = state.players
    .filter(p => p.chips > 0) // remove busted players
    .map((p, i) => ({
      ...p,
      holeCards: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      isAllIn: false,
      hasActed: false,
      isDealer: i === dealerIndex,
      isBigBlind: false,
      isSmallBlind: false,
      handResult: undefined,
      lowHandResult: undefined,
    }));

  return {
    ...state,
    deck,
    players,
    communityCards: [],
    pots: [],
    currentBet: 0,
    lastRaiseAmount: state.bigBlind,
    dealerIndex,
    phase: 'dealing',
    winners: undefined,
    studStreet: 3,
    drawRound: 0,
    handNumber: state.handNumber + 1,
    actionCount: 0,
  };
}
