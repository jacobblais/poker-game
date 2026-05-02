import { NextRequest, NextResponse } from 'next/server';
import { getRoom, deleteRoom } from '@/lib/store';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { playerId, adminPassword } = await req.json();
  const isAdmin = adminPassword === 'overlord';

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  if (room.hostId !== playerId && !isAdmin) {
    return NextResponse.json({ error: 'Only host or admin can close the table' }, { status: 403 });
  }

  await deleteRoom(roomId);
  return NextResponse.json({ success: true });
}
