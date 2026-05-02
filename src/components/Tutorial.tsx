'use client';
import React, { useState } from 'react';

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'variants' | 'multiplayer' | 'hosting'>('variants');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📖 Poker Guide & Setup
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-800/30">
          {[
            { id: 'variants', label: '🃏 Variants', color: 'text-blue-400' },
            { id: 'multiplayer', label: '🌐 Online Play', color: 'text-green-400' },
            { id: 'hosting', label: '🚀 Vercel Setup', color: 'text-orange-400' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${
                tab === t.id ? `bg-white/5 border-current ${t.color}` : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-white/80 space-y-4">
          {tab === 'variants' && (
            <div className="space-y-6">
              <section>
                <h3 className="text-blue-400 font-bold mb-2">Texas Hold&apos;em</h3>
                <p className="text-sm">The gold standard. 2 hole cards, 5 community cards. Best 5-card hand wins.</p>
              </section>
              <section>
                <h3 className="text-blue-400 font-bold mb-2">Omaha & Omaha Hi-Lo</h3>
                <p className="text-sm">You get 4 cards but <strong>must use exactly 2</strong> from your hand and 3 from the board. Hi-Lo splits the pot between the best high and best low hand.</p>
              </section>
              <section>
                <h3 className="text-blue-400 font-bold mb-2">7-Card Stud & Razz</h3>
                <p className="text-sm">No community cards. You get 7 cards total (some up, some down). In Razz, the <strong>lowest</strong> hand wins!</p>
              </section>
              <section>
                <h3 className="text-blue-400 font-bold mb-2">5-Card Draw</h3>
                <p className="text-sm">Classic video poker style. Get 5 cards, discard what you don&apos;t want, and draw new ones.</p>
              </section>
            </div>
          )}

          {tab === 'multiplayer' && (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-2xl">
                <h3 className="text-green-400 font-bold mb-2">Playing with Friends</h3>
                <ol className="list-decimal list-inside text-sm space-y-2">
                  <li>Click <strong>Online Multiplayer</strong> on the main menu.</li>
                  <li>Enter your name and create a new table.</li>
                  <li>Copy the <strong>Room Code</strong> (e.g., AB12CD34) from the top of the game.</li>
                  <li>Your friend enters that code in the &quot;Join by Code&quot; box.</li>
                </ol>
              </div>
              <p className="text-xs text-white/40 italic">Note: Table data resets if the server restarts. For persistent games, see the Vercel Setup tab.</p>
            </div>
          )}

          {tab === 'hosting' && (
            <div className="space-y-4">
              <h3 className="text-orange-400 font-bold">Deploy to Vercel</h3>
              <p className="text-sm">This app is built with Next.js and ready for Vercel.</p>
              <div className="bg-slate-800 p-3 rounded-xl font-mono text-xs text-orange-200">
                npm install -g vercel<br/>
                vercel
              </div>
              
              <h3 className="text-orange-400 font-bold mt-6">Persistent Multiplayer</h3>
              <p className="text-sm">To prevent games from resetting, you should connect a database to the API routes:</p>
              <ul className="list-disc list-inside text-sm space-y-2">
                <li>Create a free Redis instance on <a href="https://upstash.com" target="_blank" className="underline text-blue-400">Upstash</a>.</li>
                <li>In <code className="text-xs bg-black/40 px-1">src/lib/store.ts</code>, replace the Map logic with Upstash Redis calls.</li>
                <li>Add your <code className="text-xs bg-black/40 px-1">UPSTASH_REDIS_URL</code> to your Vercel environment variables.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/50 text-center">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/40"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
