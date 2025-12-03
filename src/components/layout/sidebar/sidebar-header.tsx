"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ isOpen, onToggle }: SidebarHeaderProps) {
  return (
    <div className="relative flex h-16 items-center justify-center border-b border-border/60 dark:border-border/70 px-4 transition-colors duration-300">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "group absolute z-50 flex h-10 w-10 items-center justify-center",
          "bg-transparent transition-all duration-300 ease-in-out",
          isOpen ? "-right-4" : "-right-6",
          "focus-visible:outline-none",
          "cursor-pointer"
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={isOpen}
        type="button"
      >
        {isOpen ? (
          <ChevronLeft 
            className="h-5 w-5 text-muted-foreground transition-all duration-300 ease-in-out" 
            strokeWidth={2.5}
          />
        ) : (
          <ChevronRight 
            className="h-5 w-5 text-muted-foreground transition-all duration-300 ease-in-out" 
            strokeWidth={2.5}
          />
        )}
      </button>
      
      {/* Logo */}
      <div className="relative flex items-center justify-center w-full">
        {isOpen ? (
          <h2 className="text-lg font-bold text-foreground transition-all duration-300 ease-in-out opacity-100">
            SS ERP
          </h2>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 ease-in-out hover:bg-primary/90 opacity-100">
            <span className="text-xs font-bold">SS</span>
          </div>
        )}
      </div>
    </div>
  );
}

