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
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}
      
      <Sidebar />
      
      <div
        className={cn(
          "flex flex-1 flex-col transition-[margin-left] duration-300 ease-smooth",
          // Mobile: no margin, tablet: small margin when closed, desktop: full margin
          "ml-0 lg:ml-16",
          isOpen && "lg:ml-64",
          "min-w-0 overflow-x-hidden"
        )}
      >
        {/* Mobile Header with Menu Toggle */}
        <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border/60 flex items-center justify-between px-4 py-3">
          <button
            onClick={toggle}
            className="p-2 rounded-md hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="text-lg font-semibold">SS ERP</h1>
          <ThemeToggle variant="icon" />
        </div>

        {/* Fixed Theme Toggle - Top Right (Desktop only) */}
        <div className="hidden lg:block fixed top-4 right-4 z-50">
          <ThemeToggle variant="icon" />
        </div>
        
        <main className="flex-1 overflow-auto overflow-x-hidden">
          {/* Responsive padding: smaller on mobile, golden ratio on desktop */}
          <div className="container mx-auto max-w-[1618px] w-full px-4 sm:px-6 md:px-8 lg:px-[2.618rem] xl:px-[4.236rem] py-4 sm:py-6 md:py-8 lg:py-[2.618rem] xl:py-[4.236rem]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
