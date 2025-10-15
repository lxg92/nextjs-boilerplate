import { NextRequest, NextResponse } from 'next/server';
import { handleLogout } from '../../lib/auth0';
import { deleteSession } from '../../lib/redis';

export const GET = handleLogout({
  returnTo: '/',
});

export const POST = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (sessionId) {
      await deleteSession(sessionId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('sessionId');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
};


