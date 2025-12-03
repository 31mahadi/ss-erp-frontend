"use client";

import { AuthInit } from "@/lib/auth/auth-init";
import { queryClient } from "@/lib/cache/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import type * as React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        {children}
        <Toaster />
      </AuthInit>
    </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
