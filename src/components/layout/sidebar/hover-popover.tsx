"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { NavItem } from "./types";

interface HoverPopoverProps {
  item: NavItem;
  children: React.ReactNode;
  isActive: boolean;
}

/**
 * Hover Popover Component for Closed Sidebar State
 * Shows nested navigation items on hover when sidebar is collapsed
 */
export function HoverPopover({ item, children, isActive }: HoverPopoverProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const handleMouseEnter = () => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!item.children || item.children.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isHovered && (
        <div 
          className="absolute left-full top-0 ml-2 z-[9999] min-w-[200px] bg-popover border rounded-lg shadow-lg p-2 animate-in fade-in slide-in-from-left-2 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-0.5">
            {item.children.map((child) => {
              if (child.href) {
                return (
                  <Link
                    key={child.id}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                      "hover:bg-accent/50",
                      isActive && "bg-accent/30 font-medium"
                    )}
                  >
                    {child.icon && <span className="text-base">{child.icon}</span>}
                    <span>{child.label}</span>
                  </Link>
                );
              }
              return (
                <NestedPopover key={child.id} item={child} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nested Popover for deeper navigation levels
 */
function NestedPopover({ item }: { item: NavItem }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const handleMouseEnter = () => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 100);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-accent/50 transition-colors">
        {item.icon && <span className="text-base">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
        {item.children && item.children.length > 0 && (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
      {isHovered && item.children && item.children.length > 0 && (
        <div 
          className="absolute left-full top-0 ml-2 z-[9999] min-w-[200px] bg-popover border rounded-lg shadow-lg p-2 animate-in fade-in slide-in-from-left-2 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-0.5">
            {item.children.map((child) => {
              if (child.href) {
                return (
                  <Link
                    key={child.id}
                    href={child.href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent/50"
                  >
                    {child.icon && <span className="text-base">{child.icon}</span>}
                    <span>{child.label}</span>
                  </Link>
                );
              }
              return (
                <NestedPopover key={child.id} item={child} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

