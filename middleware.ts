import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/ivc/:path*',
    '/api/tts/:path*',
    '/api/voices/:path*',
    '/api/subscriptions/:path*',
  ],
};

