"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { useTheme } from "@/lib/theme/theme-provider";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  variant?: "button" | "icon" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "button", className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  const themes: Array<{ value: "light" | "dark" | "system"; label: string; icon: React.ReactNode }> = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4 fill-black text-black" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4 fill-white text-white" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
          setTheme(nextTheme);
        }}
        className={cn(
          "h-10 w-10",
          "border border-border bg-background/80 backdrop-blur-sm",
          "shadow-md hover:shadow-lg",
          "hover:bg-accent hover:border-accent-foreground/20",
          "transition-all duration-200",
          "ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary/20",
          className
        )}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-5 w-5 fill-white text-white" />
        ) : (
          <Sun className="h-5 w-5 fill-black text-black dark:fill-white dark:text-white" />
        )}
      </Button>
    );
  }

  if (variant === "dropdown") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            aria-label="Theme settings"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 fill-white text-white" />
            ) : (
              <Sun className="h-4 w-4 fill-black text-black dark:fill-white dark:text-white" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Choose Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                  theme === t.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className={cn(
                  "flex-shrink-0",
                  theme === t.value ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {t.icon}
                </span>
                <span>{t.label}</span>
                {theme === t.value && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default: button variant
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(nextTheme);
      }}
      className={cn("gap-2", className)}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <>
          <Moon className="h-4 w-4 fill-white text-white" />
          <span className="hidden sm:inline">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 fill-black text-black dark:fill-white dark:text-white" />
          <span className="hidden sm:inline">Light</span>
        </>
      )}
    </Button>
  );
}

