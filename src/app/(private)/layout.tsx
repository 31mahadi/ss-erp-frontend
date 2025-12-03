"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { SkeletonDashboard } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    return <SkeletonDashboard />;
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] duration-300 ease-smooth",
          isOpen ? "ml-64" : "ml-16"
        )}
      >
        {/* Fixed Theme Toggle - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle variant="icon" />
        </div>
        
        <main className="flex-1 overflow-auto">
          {/* Golden Ratio Layout: max-width uses golden ratio proportion, padding follows golden ratio */}
          <div className="container mx-auto max-w-[1618px] px-[1.618rem] sm:px-[2.618rem] lg:px-[4.236rem] py-[2.618rem] lg:py-[4.236rem]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
