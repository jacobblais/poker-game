import { NextRequest, NextResponse } from 'next/server';
import { getRoom, deleteRoom } from '@/lib/store';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = await params;
  const { playerId } = await req.json();

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.hostId !== playerId) {
    return NextResponse.json({ error: 'Only host can close the table' }, { status: 403 });
  }

  await deleteRoom(roomId);
  return NextResponse.json({ success: true });
}
