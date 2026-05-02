'use client';
import React, { useState, useEffect } from 'react';
import { GameConfig } from './SetupScreen';
import { VARIANT_NAMES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface OnlineLobbyProps {
  config: GameConfig;
  onBack: () => void;
  onJoinRoom: (roomId: string, playerId: string) => void;
}

interface RoomInfo {
  id: string;
  name: string;
  variant: string;
  players: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  isStarted: boolean;
}

export default function OnlineLobby({ config, onBack, onJoinRoom }: OnlineLobbyProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState(`${config.playerName}'s Table`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const playerId = useState(() => uuidv4())[0];

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms ?? []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const createRoom = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName,
          variant: config.variant,
          hostId: playerId,
          hostName: config.playerName,
          smallBlind: config.smallBlind,
          bigBlind: config.bigBlind,
          buyIn: config.startingChips,
          maxPlayers: 8,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onJoinRoom(data.roomId, playerId);
      } else {
        setError('Failed to create room');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const joinRoom = async (roomId: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName: config.playerName, chips: config.startingChips }),
      });
      if (res.ok) {
        onJoinRoom(roomId, playerId);
      } else {
        setError('Failed to join room');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="text-white/60 hover:text-white transition">← Back</button>
          <h2 className="text-2xl font-bold text-white">🌐 Online Lobby</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
        )}

        {/* Create Room */}
        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">Create a Table</h3>
            <button onClick={() => setCreating(!creating)}
              className="text-green-400 text-sm hover:text-green-300 transition">
              {creating ? 'Cancel' : '+ New Table'}
            </button>
          </div>
          {creating && (
            <div className="flex gap-3">
              <input
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="Table name"
              />
              <button onClick={createRoom} disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm">
                {loading ? '...' : 'Create'}
              </button>
            </div>
          )}
        </div>

        {/* Join by code */}
        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-5 mb-4">
          <h3 className="text-white font-bold mb-3">Join by Code</h3>
          <div className="flex gap-3">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-green-500"
              placeholder="Enter room code..."
            />
            <button onClick={() => joinRoom(joinCode)} disabled={!joinCode || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition disabled:opacity-50 text-sm">
              Join
            </button>
          </div>
        </div>

        {/* Room list */}
        <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Active Tables</h3>
            <button onClick={fetchRooms} className="text-white/40 hover:text-white text-sm transition">↻ Refresh</button>
          </div>
          {rooms.length === 0 ? (
            <div className="text-center text-white/30 py-8">
              <div className="text-4xl mb-2">🃏</div>
              No active tables. Create one!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rooms.map(room => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div>
                    <div className="text-white font-semibold text-sm">{room.name}</div>
                    <div className="text-white/40 text-xs">
                      {VARIANT_NAMES[room.variant as keyof typeof VARIANT_NAMES] ?? room.variant} · ${room.smallBlind}/${room.bigBlind} · {room.players}/{room.maxPlayers} players
                    </div>
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.isStarted || room.players >= room.maxPlayers || loading}
                    className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition disabled:opacity-40"
                  >
                    {room.isStarted ? 'In Progress' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
