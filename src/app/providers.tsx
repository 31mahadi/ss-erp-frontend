"use client";

import { AuthInit } from "@/lib/auth/auth-init";
import { queryClient } from "@/lib/cache/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>{children}</AuthInit>
    </QueryClientProvider>
  );
}
