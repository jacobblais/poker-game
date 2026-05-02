import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRoom, setRoom, getRooms } from '@/lib/store';
import { GameRoom, RoomPlayer } from '@/lib/types';

export async function GET() {
  const allRooms = await getRooms();
  const rooms = allRooms
    .filter(r => !r.isStarted || r.players.length < r.maxPlayers)
    .slice(0, 20)
    .map(r => ({
      id: r.id,
      name: r.name,
      variant: r.variant,
      players: r.players.length,
      maxPlayers: r.maxPlayers,
      smallBlind: r.smallBlind,
      bigBlind: r.bigBlind,
      isStarted: r.isStarted,
    }));
  return NextResponse.json({ rooms });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, variant, hostId, hostName, smallBlind, bigBlind, buyIn, maxPlayers } = body;

  if (!name || !variant || !hostId || !hostName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const roomId = uuidv4().slice(0, 8).toUpperCase();

  const hostPlayer: RoomPlayer = {
    id: hostId,
    name: hostName,
    chips: buyIn ?? 1000,
    isBot: false,
    isReady: true,
  };

  const room: GameRoom = {
    id: roomId,
    name,
    variant,
    hostId,
    players: [hostPlayer],
    maxPlayers: Math.min(maxPlayers ?? 8, 9),
    smallBlind: smallBlind ?? 5,
    bigBlind: bigBlind ?? 10,
    buyIn: buyIn ?? 1000,
    isStarted: false,
    isPrivate: false,
    createdAt: Date.now(),
  };

  await setRoom(room);
  return NextResponse.json({ roomId });
}
