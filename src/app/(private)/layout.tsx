"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  React.useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect during initial load or if we're already on login page
    if (!isLoading && !isAuthenticated && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "ml-64" : "ml-16"
        )}
      >
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
