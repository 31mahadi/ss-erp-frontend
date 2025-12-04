"use client";

import * as React from "react";
import { useLocalStorageState, createStorageKey } from "@/lib/hooks";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Persist sidebar open/close state in localStorage
  // Default to false on mobile (screen < 1024px), true on desktop
  const [isOpen, setIsOpen] = useLocalStorageState<boolean>(
    createStorageKey("sidebar", "is-open"),
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  // Close sidebar on mobile when window resizes to mobile size
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, setIsOpen]);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

