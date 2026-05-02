'use client';
import React, { useState, useEffect } from 'react';
import { GameConfig } from './SetupScreen';
import { VARIANT_NAMES } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [adminPass, setAdminPass] = useState('');

  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('poker_player_id');
      if (saved) return saved;
      const newId = uuidv4();
      localStorage.setItem('poker_player_id', newId);
      return newId;
    }
    return uuidv4();
  });

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
  
  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, adminPassword: adminPass }),
      });
      if (res.ok) {
        fetchRooms();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete room');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05080a] relative overflow-hidden p-4 sm:p-8">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ x: -5 }}
              onClick={onBack} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
            >
              ←
            </motion.button>
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Lobby</h2>
              <div className="text-green-500 font-bold text-xs uppercase tracking-widest mt-1">Multiplayer Deck</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-xl shadow-lg">👤</div>
            <div className="pr-4">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Identity</div>
              <div className="text-white font-black uppercase text-sm">{config.playerName}</div>
            </div>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {/* Create Room */}
            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Hosting</h3>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="text-white font-black text-xl mb-6">Start a New Private Table</p>
              
              <div className="space-y-4">
                <input
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all"
                  placeholder="Table Name"
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createRoom} 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] disabled:opacity-50 text-sm uppercase tracking-widest"
                >
                  {loading ? 'Opening...' : 'Launch Table'}
                </motion.button>
              </div>
            </div>


            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 shadow-2xl">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Invitation</h3>
              <p className="text-white font-black text-xl mb-6">Join with Access Code</p>
              
              <div className="flex flex-col gap-4">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-black tracking-[0.5em] text-center focus:outline-none focus:border-blue-500/50 transition-all placeholder:tracking-normal placeholder:font-bold"
                  placeholder="CODE"
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => joinRoom(joinCode)} 
                  disabled={!joinCode || loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(79,70,229,0.2)] disabled:opacity-50 text-sm uppercase tracking-widest"
                >
                  Connect
                </motion.button>
              </div>
            </div>

            {/* Admin Access */}
            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[32px] border border-white/10 p-6 shadow-2xl opacity-40 hover:opacity-100 transition-opacity">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Authority</h3>
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs font-bold focus:outline-none focus:border-red-500/50 transition-all"
                placeholder="Admin Password"
              />
              {adminPass === 'overlord' && (
                <div className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-widest text-center animate-pulse">
                  Admin Access Granted
                </div>
              )}
            </div>
          </div>

          {/* Room list */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[40px] border border-white/10 p-8 shadow-2xl min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">Active Tables</h3>
                  <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">Live from global server</div>
                </div>
                <button onClick={fetchRooms} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">↻</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-white/20 py-12">
                    <div className="text-7xl mb-6 grayscale opacity-30">🏢</div>
                    <p className="text-xl font-black uppercase tracking-tighter">No Tables Found</p>
                    <p className="text-sm font-medium mt-2">The lobby is currently empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                      {rooms.map((room, idx) => (
                        <motion.div 
                          key={room.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all hover:bg-black/60"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                              {VARIANT_NAMES[room.variant as keyof typeof VARIANT_NAMES]?.[0] || '🃏'}
                            </div>
                            <div>
                              <div className="text-white font-black uppercase text-lg leading-tight group-hover:text-green-400 transition-colors">{room.name}</div>
                              <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="text-green-500/80">{VARIANT_NAMES[room.variant as keyof typeof VARIANT_NAMES] ?? room.variant}</span>
                                <span>•</span>
                                <span>${room.smallBlind}/${room.bigBlind}</span>
                                <span>•</span>
                                <span className={room.players >= room.maxPlayers ? 'text-red-500' : 'text-blue-400'}>
                                  {room.players}/{room.maxPlayers} Players
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block mr-2">
                              <div className="text-[10px] text-white/20 font-black uppercase tracking-widest">ID</div>
                              <div className="text-white/40 font-mono text-xs">{room.id}</div>
                            </div>
                            {adminPass === 'overlord' && (
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all"
                              >
                                🗑️
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => joinRoom(room.id)}
                              disabled={room.isStarted || room.players >= room.maxPlayers || loading}
                              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                room.isStarted 
                                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                  : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                              }`}
                            >
                              {room.isStarted ? 'Live' : 'Join'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
