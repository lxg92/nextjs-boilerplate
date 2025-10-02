"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // create client once per mount
  const [client] = useState(() => new QueryClient());
  return (
    <UserProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </UserProvider>
  );
}
