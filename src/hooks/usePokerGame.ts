'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createDeck, shuffleDeck } from '@/lib/cards';
import { GameState, Player, PlayerAction, PokerVariant } from '@/lib/types';
import {
  dealHoleCards, postBlinds, applyAction, collectBets,
  isBettingRoundComplete, dealCommunityCards, dealStudCard,
  doShowdown, initNewHand, getActivePlayers, nextActivePlayerIndex
} from '@/lib/gameEngine';
import { getBotAction } from '@/lib/botAI';

interface UsePokerGameOptions {
  variant: PokerVariant;
  numBots: number;
  botDifficulty: 'easy' | 'medium' | 'hard';
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  playerName: string;
}

// advancePhase lives outside the hook so it can be shared
function advancePhase(s: GameState): GameState {
  const active = getActivePlayers(s);
  if (active.length === 1) return doShowdown(collectBets(s));

  const variant = s.variant;
  let next = collectBets(s);

  if (variant === 'texas_holdem' || variant === 'omaha' || variant === 'omaha_hilo') {
    switch (s.phase) {
      case 'preflop': next = dealCommunityCards(next, 3); next = { ...next, phase: 'flop' }; break;
      case 'flop':   next = dealCommunityCards(next, 1); next = { ...next, phase: 'turn' }; break;
      case 'turn':   next = dealCommunityCards(next, 1); next = { ...next, phase: 'river' }; break;
      case 'river':  next = doShowdown(next); break;
      default: break;
    }
  } else if (variant === 'five_draw') {
    if (s.phase === 'preflop') {
      next = { ...next, phase: 'draw', drawRound: 1 };
    } else if (s.phase === 'draw') {
      next = { ...next, phase: 'river' };
    } else {
      next = doShowdown(next);
    }
  } else {
    const street = s.studStreet ?? 3;
    if (street < 7) {
      next = dealStudCard(next);
      next = { ...next, phase: street === 6 ? 'river' : 'flop' };
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

function startNewHand(s: GameState): GameState {
  let next = initNewHand(s);
  next = dealHoleCards(next);
  if (['texas_holdem', 'omaha', 'omaha_hilo', 'five_draw'].includes(next.variant)) {
    next = postBlinds(next);
    next = { ...next, phase: 'preflop' };
  } else {
    next = { ...next, phase: 'preflop', currentBet: next.smallBlind };
  }
  return next;
}

export function usePokerGame(options: UsePokerGameOptions) {
  const [state, setStateRaw] = useState<GameState | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  // Keep stateRef in sync
  const setState = useCallback((s: GameState) => {
    stateRef.current = s;
    setStateRaw(s);
  }, []);

  const initGame = useCallback(() => {
    // Only initialize if not already done
    if (stateRef.current) return;

    const playerId = uuidv4();
    const players: Player[] = [
      {
        id: playerId, name: options.playerName, chips: options.startingChips,
        holeCards: [], bet: 0, totalBet: 0, folded: false, isAllIn: false, hasActed: false,
        isBot: false, seatIndex: 0, isDealer: true, isBigBlind: false, isSmallBlind: false,
        avatar: '🧑',
      },
    ];
    const botNames = ['Alex', 'Blake', 'Casey', 'Dana', 'Eli', 'Faye', 'Gray', 'Hana'];
    const botEmojis = ['🤖', '👾', '🎭', '🦊', '🐺', '🦁', '🐯', '🦅'];
    for (let i = 0; i < options.numBots; i++) {
      players.push({
        id: uuidv4(), name: botNames[i % botNames.length], chips: options.startingChips,
        holeCards: [], bet: 0, totalBet: 0, folded: false, isAllIn: false, hasActed: false,
        isBot: true, botDifficulty: options.botDifficulty, seatIndex: i + 1,
        isDealer: false, isBigBlind: false, isSmallBlind: false,
        avatar: botEmojis[i % botEmojis.length],
      });
    }

    const initial: GameState = {
      id: uuidv4(),
      variant: options.variant,
      phase: 'waiting',
      players,
      deck: shuffleDeck(createDeck()),
      communityCards: [],
      pots: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      smallBlind: options.smallBlind,
      bigBlind: options.bigBlind,
      currentBet: 0,
      lastRaiseAmount: options.bigBlind,
      handNumber: 0,
      actionCount: 0,
      studStreet: 3,
      drawRound: 0,
    };

    setState(startNewHand(initial));
  }, [options.playerName, options.startingChips, options.numBots, options.botDifficulty, options.variant, options.smallBlind, options.bigBlind, setState]);

  useEffect(() => { initGame(); }, [initGame]);

  // ── Player Action ──────────────────────────────────────────────────────────
  const playerAction = useCallback((action: PlayerAction, amount?: number) => {
    const cur = stateRef.current;
    if (!cur || processingRef.current) return;
    const currentPlayer = cur.players[cur.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isBot) return;

    let next = applyAction(cur, currentPlayer.id, action, amount);
    if (isBettingRoundComplete(next)) next = advancePhase(next);
    setState(next);
  }, [setState]);

  // ── Draw Cards (5-Card Draw) ───────────────────────────────────────────────
  const drawCards = useCallback((cardIndices: number[]) => {
    const cur = stateRef.current;
    if (!cur) return;
    const currentPlayer = cur.players[cur.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isBot) return;

    const deck = [...cur.deck];
    const players = cur.players.map(p => {
      if (p.id !== currentPlayer.id) return p;
      const newHand = p.holeCards.map((c, i) => {
        if (cardIndices.includes(i)) {
          const newCard = deck.pop()!;
          newCard.faceUp = true;
          return newCard;
        }
        return c;
      });
      return { ...p, holeCards: newHand };
    });
    const nextIdx = nextActivePlayerIndex({ ...cur, players }, cur.currentPlayerIndex);
    setState({ ...cur, deck, players, currentPlayerIndex: nextIdx });
  }, [setState]);

  // ── New Hand ───────────────────────────────────────────────────────────────
  const newHand = useCallback(() => {
    const cur = stateRef.current;
    if (!cur) return;
    setState(startNewHand(cur));
  }, [setState]);

  // ── Game Loop Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    const cur = stateRef.current;
    if (!cur || cur.phase === 'ended' || cur.phase === 'waiting') return;

    // 1. Auto-advance if betting round is complete
    // This handles the "all-in" scenario where no one can act
    if (isBettingRoundComplete(cur)) {
      const timer = setTimeout(() => {
        const latest = stateRef.current;
        if (latest && isBettingRoundComplete(latest)) {
          setState(advancePhase(latest));
        }
      }, 500); // Short delay for visual clarity
      return () => clearTimeout(timer);
    }

    // 2. Bot Processing
    const currentPlayer = cur.players[cur.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isBot || currentPlayer.folded || currentPlayer.isAllIn) return;
    if (processingRef.current) return;

    processingRef.current = true;
    const delay = 300 + Math.random() * 400; // Faster bot turns

    botTimerRef.current = setTimeout(() => {
      const latest = stateRef.current;
      if (!latest) { processingRef.current = false; return; }
      const bot = latest.players[latest.currentPlayerIndex];
      if (!bot || !bot.isBot || bot.folded || bot.isAllIn) { 
        processingRef.current = false; 
        return; 
      }

      const decision = getBotAction(bot, latest);
      let next = applyAction(latest, bot.id, decision.action, decision.amount);
      
      // Note: isBettingRoundComplete(next) check is now handled by the auto-advance effect above
      
      processingRef.current = false;
      setState(next);
    }, delay);

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [state?.currentPlayerIndex, state?.phase, state?.handNumber, setState]);

  const humanPlayer = state?.players.find(p => !p.isBot) ?? null;
  const isHumanTurn = state
    ? !state.players[state.currentPlayerIndex]?.isBot && state.phase !== 'ended' && state.phase !== 'waiting'
    : false;
  const callAmount = state && humanPlayer
    ? Math.max(0, state.currentBet - (humanPlayer.bet ?? 0))
    : 0;

  return { state, playerAction, drawCards, newHand, initGame, humanPlayer, isHumanTurn, callAmount };
}
