import { Card, RANK_VALUES } from './cards';

export type HandRank =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card';

export interface HandResult {
  rank: HandRank;
  rankValue: number;
  name: string;
  tiebreakers: number[];
  cards: Card[];
}

const HAND_RANK_VALUES: Record<HandRank, number> = {
  royal_flush: 9,
  straight_flush: 8,
  four_of_a_kind: 7,
  full_house: 6,
  flush: 5,
  straight: 4,
  three_of_a_kind: 3,
  two_pair: 2,
  one_pair: 1,
  high_card: 0,
};

function getCardValue(rank: string): number {
  return RANK_VALUES[rank as keyof typeof RANK_VALUES] ?? 0;
}

function getCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const card of cards) {
    const v = getCardValue(card.rank);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(values: number[]): boolean {
  const sorted = [...new Set(values)].sort((a, b) => b - a);
  if (sorted.length < 5) return false;
  for (let i = 0; i <= sorted.length - 5; i++) {
    if (sorted[i] - sorted[i + 4] === 4 && new Set(sorted.slice(i, i + 5)).size === 5) return true;
  }
  // Wheel: A-2-3-4-5
  if (sorted.includes(14) && sorted.includes(2) && sorted.includes(3) && sorted.includes(4) && sorted.includes(5)) return true;
  return false;
}

function getStraightHigh(values: number[]): number {
  const sorted = [...new Set(values)].sort((a, b) => b - a);
  for (let i = 0; i <= sorted.length - 5; i++) {
    if (sorted[i] - sorted[i + 4] === 4 && new Set(sorted.slice(i, i + 5)).size === 5) return sorted[i];
  }
  // Wheel
  if (sorted.includes(14) && sorted.includes(2) && sorted.includes(3) && sorted.includes(4) && sorted.includes(5)) return 5;
  return 0;
}

export function evaluateHand(cards: Card[]): HandResult {
  // Work with best 5-card hand from given cards (up to 7)
  const best = findBestHand(cards);
  return best;
}

function evaluateFiveCards(cards: Card[]): HandResult {
  const values = cards.map(c => getCardValue(c.rank)).sort((a, b) => b - a);
  const counts = getCounts(cards);
  const flush = isFlush(cards);
  const straight = isStraight(values);
  const straightHigh = getStraightHigh(values);

  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (flush && straight && straightHigh === 14) {
    return { rank: 'royal_flush', rankValue: 9, name: 'Royal Flush', tiebreakers: [14], cards };
  }
  if (flush && straight) {
    return { rank: 'straight_flush', rankValue: 8, name: 'Straight Flush', tiebreakers: [straightHigh], cards };
  }
  if (groups[0][1] === 4) {
    const quad = groups[0][0];
    const kicker = groups[1][0];
    return { rank: 'four_of_a_kind', rankValue: 7, name: 'Four of a Kind', tiebreakers: [quad, kicker], cards };
  }
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return { rank: 'full_house', rankValue: 6, name: 'Full House', tiebreakers: [groups[0][0], groups[1][0]], cards };
  }
  if (flush) {
    return { rank: 'flush', rankValue: 5, name: 'Flush', tiebreakers: values, cards };
  }
  if (straight) {
    return { rank: 'straight', rankValue: 4, name: 'Straight', tiebreakers: [straightHigh], cards };
  }
  if (groups[0][1] === 3) {
    const trips = groups[0][0];
    const kickers = groups.filter(g => g[1] === 1).map(g => g[0]).sort((a, b) => b - a);
    return { rank: 'three_of_a_kind', rankValue: 3, name: 'Three of a Kind', tiebreakers: [trips, ...kickers], cards };
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairs = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    const kicker = groups.find(g => g[1] === 1)?.[0] ?? 0;
    return { rank: 'two_pair', rankValue: 2, name: 'Two Pair', tiebreakers: [...pairs, kicker], cards };
  }
  if (groups[0][1] === 2) {
    const pair = groups[0][0];
    const kickers = groups.filter(g => g[1] === 1).map(g => g[0]).sort((a, b) => b - a);
    return { rank: 'one_pair', rankValue: 1, name: 'One Pair', tiebreakers: [pair, ...kickers], cards };
  }
  return { rank: 'high_card', rankValue: 0, name: 'High Card', tiebreakers: values, cards };
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function findBestHand(cards: Card[]): HandResult {
  if (cards.length <= 5) return evaluateFiveCards(cards);
  const combos = combinations(cards, 5);
  let best: HandResult | null = null;
  for (const combo of combos) {
    const result = evaluateFiveCards(combo);
    if (!best || compareHands(result, best) > 0) {
      best = result;
    }
  }
  return best!;
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

// Low hand evaluation for Razz / Hi-Lo (best low is A-2-3-4-5)
export function evaluateLowHand(cards: Card[]): HandResult {
  // For low: Aces are low (value 1), no straights/flushes count against you
  // Best low: 5-4-3-2-A (the wheel)
  const lowValues = cards.map(c => {
    const v = RANK_VALUES[c.rank as keyof typeof RANK_VALUES];
    return v === 14 ? 1 : v; // Ace = 1 for low
  });

  // For low hand, we want 5 unique ranks, all 8 or below
  const unique = [...new Set(lowValues)].filter(v => v <= 8);
  if (unique.length < 5) {
    return { rank: 'high_card', rankValue: -1, name: 'No Low Hand', tiebreakers: [], cards };
  }

  // Best 5 lowest unique cards
  const best5 = [...new Set(lowValues)].sort((a, b) => a - b).slice(0, 5);
  const tiebreakers = [...best5].sort((a, b) => b - a); // descending for comparison (lower is better)

  return {
    rank: 'high_card',
    rankValue: 0,
    name: `Low: ${best5.sort((a,b)=>b-a).join('-')}`,
    tiebreakers,
    cards
  };
}

export function compareLowHands(a: HandResult, b: HandResult): number {
  // For low hands, lower tiebreakers win
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const av = a.tiebreakers[i] ?? 0;
    const bv = b.tiebreakers[i] ?? 0;
    if (av !== bv) return bv - av; // reversed: lower wins
  }
  return 0;
}
