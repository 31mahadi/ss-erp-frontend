"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/lib/theme/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  
  return (
    <SonnerToaster
      position="top-right"
      theme={resolvedTheme}
      closeButton={false}
      duration={5000}
      expand={false}
      richColors={false}
      visibleToasts={5}
      gap={8}
      toastOptions={{
        className: "sonner-toast",
        style: {
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
    />
  );
}

