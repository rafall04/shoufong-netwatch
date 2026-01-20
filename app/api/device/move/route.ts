import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role authorization (ADMIN or OPERATOR only)
  if (session.user.role !== 'ADMIN' && session.user.role !== 'OPERATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { deviceId, positionX, positionY } = body;

    // Validate required fields
    if (!deviceId || positionX === undefined || positionY === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, positionX, positionY' },
        { status: 400 }
      );
    }

    // Validate that deviceId is a string
    if (typeof deviceId !== 'string' || !deviceId) {
      return NextResponse.json(
        { error: 'Invalid deviceId' },
        { status: 400 }
      );
    }

    // Validate that positions are numbers
    const x = parseFloat(positionX);
    const y = parseFloat(positionY);
    if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
      return NextResponse.json(
        { error: 'Invalid position coordinates - must be finite numbers' },
        { status: 400 }
      );
    }

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Update device coordinates
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        positionX: x,
        positionY: y,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating device position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
