import { GameState, Player, PlayerAction } from './types';
import { evaluateHand, compareHands } from './handEvaluator';
import { getActivePlayers } from './gameEngine';

// Bot AI with 3 difficulty levels

interface BotDecision {
  action: PlayerAction;
  amount?: number;
}

function getHandStrength(player: Player, state: GameState): number {
  const cards = [...player.holeCards, ...state.communityCards];
  if (cards.length < 2) return 0.5;
  try {
    const result = evaluateHand(cards);
    // Normalize 0-9 rank to 0-1
    return result.rankValue / 9;
  } catch {
    return 0.3;
  }
}

function preflop2CardStrength(player: Player): number {
  const cards = player.holeCards;
  if (cards.length < 2) return 0.3;
  const [a, b] = cards;
  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  const av = rankValues[a.rank] ?? 7;
  const bv = rankValues[b.rank] ?? 7;
  const isPair = a.rank === b.rank;
  const isSuited = a.suit === b.suit;
  const isConnected = Math.abs(av - bv) <= 2;
  const base = (av + bv) / 28; // normalize
  let bonus = 0;
  if (isPair) bonus += 0.25;
  if (isSuited) bonus += 0.05;
  if (isConnected) bonus += 0.05;
  return Math.min(1, base + bonus);
}

export function getBotAction(player: Player, state: GameState): BotDecision {
  const difficulty = player.botDifficulty ?? 'medium';
  const active = getActivePlayers(state);
  const callAmount = Math.max(0, state.currentBet - player.bet);
  const potSize = state.pots.reduce((s, p) => s + p.amount, 0) + state.players.reduce((s, p) => s + p.bet, 0);
  const canCheck = callAmount === 0;

  // Determine hand strength
  let strength: number;
  if (state.communityCards.length === 0) {
    strength = preflop2CardStrength(player);
  } else {
    strength = getHandStrength(player, state);
  }

  // Add randomness based on difficulty
  const bluffChance = difficulty === 'easy' ? 0.03 : difficulty === 'medium' ? 0.08 : 0.15;
  const noise = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.05 : 0.02;
  const adjustedStrength = strength + (Math.random() - 0.5) * noise;
  const isBluffing = Math.random() < bluffChance;

  const effectiveStrength = isBluffing ? Math.random() * 0.4 + 0.6 : adjustedStrength;

  // Easy bots play very straightforward
  if (difficulty === 'easy') {
    if (effectiveStrength < 0.35) return canCheck ? { action: 'check' } : { action: 'fold' };
    if (effectiveStrength < 0.6) return canCheck ? { action: 'check' } : { action: 'call' };
    return { action: 'raise', amount: Math.min(callAmount + state.bigBlind * 2, player.chips) };
  }

  // Medium bots
  if (difficulty === 'medium') {
    if (effectiveStrength < 0.3) return canCheck ? { action: 'check' } : { action: 'fold' };
    if (effectiveStrength < 0.5) {
      if (canCheck) return { action: 'check' };
      if (callAmount <= potSize * 0.3) return { action: 'call' };
      return { action: 'fold' };
    }
    if (effectiveStrength < 0.7) return { action: 'call' };
    const raiseSize = Math.min(potSize * 0.75, player.chips);
    if (raiseSize <= callAmount) return { action: 'call' };
    return { action: 'raise', amount: Math.floor(raiseSize) };
  }

  // Hard bots use pot odds and position-aware logic
  const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
  const requiredEquity = potOdds;

  if (effectiveStrength < requiredEquity - 0.1) {
    return canCheck ? { action: 'check' } : { action: 'fold' };
  }

  if (effectiveStrength > 0.75) {
    // Strong hand: bet/raise for value
    const raiseSize = Math.min(
      Math.floor(potSize * (0.5 + effectiveStrength * 0.5)),
      player.chips
    );
    if (raiseSize > callAmount && raiseSize > state.bigBlind) {
      return { action: 'raise', amount: raiseSize };
    }
  }

  if (effectiveStrength > 0.55 || effectiveStrength > requiredEquity + 0.1) {
    return { action: 'call' };
  }

  // Bluff occasionally
  if (isBluffing && canCheck === false) {
    const bluffSize = Math.floor(potSize * 0.6);
    if (bluffSize > callAmount && bluffSize <= player.chips) {
      return { action: 'raise', amount: bluffSize };
    }
  }

  return canCheck ? { action: 'check' } : { action: 'fold' };
}
