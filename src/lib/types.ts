import { Card } from './cards';
import { HandResult } from './handEvaluator';

export type PokerVariant =
  | 'texas_holdem'
  | 'omaha'
  | 'omaha_hilo'
  | 'seven_stud'
  | 'seven_stud_hilo'
  | 'five_draw'
  | 'razz';

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all_in';
export type GamePhase =
  | 'waiting'
  | 'dealing'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'draw'
  | 'showdown'
  | 'ended';

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  bet: number;
  totalBet: number;
  folded: boolean;
  isAllIn: boolean;
  hasActed: boolean; // New: track if player acted this round
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  seatIndex: number;
  isDealer: boolean;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  handResult?: HandResult;
  lowHandResult?: HandResult;
  isConnected?: boolean;
  avatar?: string;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface GameState {
  id: string;
  variant: PokerVariant;
  phase: GamePhase;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pots: Pot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  currentBet: number;
  lastRaiseAmount: number;
  handNumber: number;
  actionCount: number; // New: track total actions in current round
  winners?: WinnerInfo[];
  lastAction?: { playerId: string; action: PlayerAction; amount?: number };
  studStreet?: number; // for 7-card stud: which street (3-7)
  drawRound?: number; // for 5-card draw
}

export interface WinnerInfo {
  playerId: string;
  playerName: string;
  potAmount: number;
  handName: string;
  isLow?: boolean;
}

export interface GameRoom {
  id: string;
  name: string;
  variant: PokerVariant;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  isStarted: boolean;
  isPrivate: boolean;
  password?: string;
  gameState?: GameState;
  createdAt: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  chips: number;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isReady: boolean;
}

export type ActionMessage =
  | { type: 'JOIN_ROOM'; roomId: string; playerId: string; playerName: string }
  | { type: 'LEAVE_ROOM'; roomId: string; playerId: string }
  | { type: 'START_GAME'; roomId: string }
  | { type: 'PLAYER_ACTION'; roomId: string; playerId: string; action: PlayerAction; amount?: number }
  | { type: 'DRAW_CARDS'; roomId: string; playerId: string; cardIndices: number[] }
  | { type: 'CHAT_MESSAGE'; roomId: string; playerId: string; playerName: string; message: string }
  | { type: 'GAME_STATE_UPDATE'; roomId: string; gameState: GameState }
  | { type: 'ROOM_UPDATE'; room: GameRoom };

export const VARIANT_NAMES: Record<PokerVariant, string> = {
  texas_holdem: "Texas Hold'em",
  omaha: 'Omaha',
  omaha_hilo: 'Omaha Hi-Lo',
  seven_stud: '7-Card Stud',
  seven_stud_hilo: '7-Card Stud Hi-Lo',
  five_draw: '5-Card Draw',
  razz: 'Razz',
};

export const VARIANT_DESCRIPTIONS: Record<PokerVariant, string> = {
  texas_holdem: '2 hole cards, 5 community cards. Most popular variant.',
  omaha: '4 hole cards, must use exactly 2. High only.',
  omaha_hilo: '4 hole cards, split pot between best high and low hand.',
  seven_stud: '7 cards dealt, no community cards. Best 5-card hand wins.',
  seven_stud_hilo: '7-Card Stud with split pot for high and low.',
  five_draw: '5 cards, one draw round. Classic poker.',
  razz: '7-Card Stud where the lowest hand wins.',
};
