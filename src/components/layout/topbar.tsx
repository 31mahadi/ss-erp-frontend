"use client";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useRouter } from "next/navigation";
import * as React from "react";

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6 ${className || ""}`}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">SS ERP</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">
              {user.firstName} {user.lastName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
