"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, LogOut, User, Mail, Settings } from "lucide-react";
import type { User as UserType } from "@/lib/auth/types";

interface SidebarUserProfileProps {
  user: UserType | null;
  isOpen: boolean;
  onLogout: () => void;
}

export function SidebarUserProfile({ user, isOpen, onLogout }: SidebarUserProfileProps) {
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const profileButtonRef = React.useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  const ProfileMenuContent = () => (
    <>
      <div className="px-2 py-2.5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={getUserDisplayName()}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs">{getUserInitials()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
      <div className="p-0.5 space-y-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{getUserDisplayName()}</span>
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{user?.email}</span>
        </div>
        {user?.roles && user.roles.length > 0 && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{user.roles.join(", ")}</span>
          </div>
        )}
      </div>
      <div className="border-t p-0.5">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  if (isOpen) {
    return (
      <div className={cn("border-t border-border/60 dark:border-border/70 bg-muted/50 flex-shrink-0")} data-profile-menu>
        <div className="p-3 space-y-2">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background hover:bg-accent w-full transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={getUserDisplayName()}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs">{getUserInitials()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-transform",
                profileMenuOpen && "rotate-180"
              )}
            />
          </button>

          {profileMenuOpen && (
            <div className="bg-background border rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150">
              <ProfileMenuContent />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Collapsed state
  return (
    <div className={cn("border-t border-border/60 dark:border-border/70 bg-muted/50 overflow-visible flex-shrink-0")} data-profile-menu>
      <div className="p-2 space-y-2">
        <div className="relative">
          <button
            ref={profileButtonRef}
            onClick={() => {
              if (profileButtonRef.current) {
                const rect = profileButtonRef.current.getBoundingClientRect();
                setPopoverPosition({
                  top: rect.top + rect.height / 2,
                  left: rect.right + 8,
                });
              }
              setProfileMenuOpen(!profileMenuOpen);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors mx-auto"
            title={getUserDisplayName()}
            data-profile-menu
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={getUserDisplayName()}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs">{getUserInitials()}</span>
            )}
          </button>
          
          {mounted && profileMenuOpen && createPortal(
            <div 
              className="fixed z-[9999] min-w-[220px] bg-background border rounded-lg shadow-lg animate-in fade-in slide-in-from-left-2 duration-150"
              style={{ 
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
                transform: 'translateY(-90%)'
              }}
              onMouseEnter={() => setProfileMenuOpen(true)}
              onMouseLeave={() => setProfileMenuOpen(false)}
              data-profile-menu
            >
              <ProfileMenuContent />
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
}

