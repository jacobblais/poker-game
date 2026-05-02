'use client';
import React, { useEffect, useRef, useState } from 'react';
import PokerTable from './PokerTable';
import { GameState, PlayerAction } from '@/lib/types';

interface OnlineGameProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  ts: number;
}

export default function OnlineGame({ roomId, playerId, playerName, onBack }: OnlineGameProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [hostId, setHostId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll game state (simple polling for Vercel compatibility)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.gameState) setGameState(data.gameState);
          if (data.chat) setChat(data.chat);
          setPlayers(data.players ?? []);
          setIsStarted(data.isStarted ?? false);
          setHostId(data.hostId ?? '');
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [roomId]);

  const startGame = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/start`, { method: 'POST' });
      if (!res.ok) setError('Only host can start the game');
    } catch {
      setError('Failed to start game');
    }
  };

  const isHost = playerId === hostId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendAction = async (action: PlayerAction, amount?: number) => {
    try {
      await fetch(`/api/rooms/${roomId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action, amount }),
      });
    } catch {}
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, message: chatInput.trim() }),
      });
      setChatInput('');
    } catch {}
  };

  const humanPlayer = gameState?.players.find(p => p.id === playerId) ?? null;
  const isHumanTurn = gameState
    ? gameState.players[gameState.currentPlayerIndex]?.id === playerId && gameState.phase !== 'ended'
    : false;
  const callAmount = gameState && humanPlayer
    ? Math.max(0, gameState.currentBet - (humanPlayer.bet ?? 0))
    : 0;

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏠</div>
            <h2 className="text-2xl font-bold text-white">Table Lobby</h2>
            <div className="text-white/40 text-sm font-mono mt-1">Code: {roomId}</div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="text-xs font-bold text-white/30 uppercase tracking-widest">Players ({players.length})</div>
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white font-medium">{p.name} {p.id === hostId ? '👑' : ''}</span>
                <span className="text-xs text-green-400">Ready</span>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
              <div key={`ph-${i}`} className="p-3 border border-dashed border-white/10 rounded-xl text-center text-white/20 text-xs">
                Waiting for player...
              </div>
            ))}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white font-bold rounded-2xl transition shadow-xl shadow-green-900/40"
            >
              {players.length < 2 ? 'Waiting for Players...' : '🚀 Start Game'}
            </button>
          ) : (
            <div className="text-center text-white/50 animate-pulse">
              Waiting for host to start...
            </div>
          )}

          <button onClick={onBack} className="w-full mt-4 text-white/30 hover:text-white transition text-sm">
            ← Leave Room
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-white/50 text-lg animate-pulse">Dealing cards...</div>
        <div className="text-white/30 text-sm font-mono">Room: {roomId}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 flex">
      {/* Game */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <button onClick={onBack} className="text-white/50 hover:text-white text-sm transition">← Lobby</button>
          <div className="text-center">
            <div className="text-white font-bold text-sm">Online Table</div>
            <div className="text-white/40 text-xs">Room: {roomId} · {connected ? '🟢 Connected' : '🔴 Reconnecting...'}</div>
          </div>
          <div className="text-yellow-300 font-mono font-bold text-sm">${humanPlayer?.chips.toLocaleString() ?? 0}</div>
        </div>
        <div className="p-4 flex-1">
          <PokerTable
            state={gameState}
            humanPlayer={humanPlayer}
            isHumanTurn={isHumanTurn}
            callAmount={callAmount}
            onAction={sendAction}
            onDraw={(indices) => fetch(`/api/rooms/${roomId}/draw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId, cardIndices: indices }),
            })}
            onNewHand={() => fetch(`/api/rooms/${roomId}/next-hand`, { method: 'POST' })}
          />
        </div>
      </div>

      {/* Chat sidebar */}
      <div className="w-64 border-l border-white/10 flex flex-col bg-black/30 backdrop-blur-sm">
        <div className="p-3 border-b border-white/10 text-white font-bold text-sm">💬 Table Chat</div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {chat.map(msg => (
            <div key={msg.id} className={`text-xs ${msg.playerId === playerId ? 'text-right' : ''}`}>
              <span className="text-white/40">{msg.playerName}: </span>
              <span className="text-white">{msg.message}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
            placeholder="Say something..."
          />
          <button onClick={sendChat}
            className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
