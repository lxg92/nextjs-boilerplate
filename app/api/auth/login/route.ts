import { NextRequest, NextResponse } from 'next/server';
import { handleLogin } from '../../lib/auth0';

export const GET = handleLogin({
  returnTo: '/dashboard',
});


