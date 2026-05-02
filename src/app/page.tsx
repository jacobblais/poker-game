'use client';
import React, { useState } from 'react';
import SetupScreen, { GameConfig } from '@/components/SetupScreen';
import PokerTable from '@/components/PokerTable';
import OnlineLobby from '@/components/OnlineLobby';
import OnlineGame from '@/components/OnlineGame';
import { usePokerGame } from '@/hooks/usePokerGame';
import { VARIANT_NAMES } from '@/lib/types';

type Screen = 'setup' | 'bot-game' | 'online-lobby' | 'online-game';

function BotGame({ config, onBack }: { config: GameConfig; onBack: () => void }) {
  const gameOptions = React.useMemo(() => ({
    variant: config.variant,
    numBots: config.numBots,
    botDifficulty: config.botDifficulty,
    startingChips: config.startingChips,
    smallBlind: config.smallBlind,
    bigBlind: config.bigBlind,
    playerName: config.playerName,
  }), [config]);

  const { state, playerAction, drawCards, newHand, humanPlayer, isHumanTurn, callAmount } = usePokerGame(gameOptions);

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      Loading...
    </div>
  );

  const isEliminated = humanPlayer && humanPlayer.chips === 0 && state.phase === 'ended';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <button onClick={onBack} className="text-white/50 hover:text-white text-sm transition flex items-center gap-1">
          ← Menu
        </button>
        <div className="text-center">
          <div className="text-white font-bold text-sm">{VARIANT_NAMES[config.variant]}</div>
          <div className="text-white/40 text-xs">Hand #{state.handNumber} · ${state.smallBlind}/${state.bigBlind}</div>
        </div>
        <div className="text-right">
          <div className="text-yellow-300 font-mono font-bold text-sm">${humanPlayer?.chips.toLocaleString() ?? 0}</div>
          <div className="text-white/40 text-xs">Your Stack</div>
        </div>
      </div>

      <div className="flex-1 p-2 min-h-0 overflow-auto">
        <PokerTable
          state={state}
          humanPlayer={humanPlayer}
          isHumanTurn={isHumanTurn}
          callAmount={callAmount}
          onAction={playerAction}
          onDraw={drawCards}
          onNewHand={newHand}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [onlineRoomId, setOnlineRoomId] = useState('');
  const [onlinePlayerId, setOnlinePlayerId] = useState('');

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    if (cfg.mode === 'bots') {
      setScreen('bot-game');
    } else {
      setScreen('online-lobby');
    }
  };

  const handleJoinRoom = (roomId: string, playerId: string) => {
    setOnlineRoomId(roomId);
    setOnlinePlayerId(playerId);
    setScreen('online-game');
  };

  if (screen === 'setup') return <SetupScreen onStart={handleStart} />;
  if (screen === 'bot-game' && config) return <BotGame config={config} onBack={() => setScreen('setup')} />;
  if (screen === 'online-lobby' && config) return (
    <OnlineLobby config={config} onBack={() => setScreen('setup')} onJoinRoom={handleJoinRoom} />
  );
  if (screen === 'online-game' && config) return (
    <OnlineGame
      roomId={onlineRoomId}
      playerId={onlinePlayerId}
      playerName={config.playerName}
      onBack={() => setScreen('online-lobby')}
    />
  );
  return null;
}
