"use client";

import { useAccessStore } from "@/lib/access/access-store";
import { useAuthStore } from "@/lib/auth/auth-store";
import { cn } from "@/lib/utils/cn";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  User,
  Mail,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { useSidebar } from "./sidebar-context";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  children?: NavItem[];
  type: "module" | "submodule" | "feature";
}

// Hover Popover Component for Closed State
function HoverPopover({
  item,
  children,
  isActive,
}: {
  item: NavItem;
  children: React.ReactNode;
  isActive: boolean;
}) {
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
          className="absolute left-full top-0 ml-2 z-[9999] min-w-[200px] bg-popover border rounded-lg shadow-lg p-2"
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
          className="absolute left-full top-0 ml-2 z-[9999] min-w-[200px] bg-popover border rounded-lg shadow-lg p-2"
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

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const access = useAccessStore((state) => state.access);
  const { user, logout } = useAuthStore();
  const { isOpen, setIsOpen } = useSidebar();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const profileButtonRef = React.useRef<HTMLButtonElement>(null);
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const modules = React.useMemo(() => {
    const mods = access?.modules ?? [];
    return mods;
  }, [access]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const navItems = React.useMemo((): NavItem[] => {
    const items: NavItem[] = [];

    items.push({
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      type: "feature",
    });

    const hasAllAccess = access?.hasAllAccess || user?.access?.hasAllAccess;
    const isRootAdmin = user?.roles?.includes('Root Admin') || false;
    const isSuperAdmin = user?.roles?.includes('Super Admin') || false;
    const isAdmin = user?.roles?.includes('Admin') || false;
    const hasAdminAccess = hasAllAccess || isRootAdmin || isSuperAdmin || isAdmin;
    
    if (hasAdminAccess) {
      items.push({
        id: "system-management",
        label: "System Management",
        href: "/system-management",
        icon: "⚙️",
        type: "feature",
      });
    }

    for (const module of modules) {
      const moduleItem: NavItem = {
        id: module.id,
        label: module.name,
        icon: module.icon,
        type: "module",
        children: [],
      };

      if (module.submodules && module.submodules.length > 0) {
        for (const submodule of module.submodules) {
          const submoduleItem: NavItem = {
            id: submodule.id,
            label: submodule.name,
            icon: submodule.icon,
            type: "submodule",
            children: [],
          };

          const features = submodule.features || [];
          for (const feature of features) {
            submoduleItem.children?.push({
              id: feature.id,
              label: feature.name,
              href: feature.route || `#${feature.slug || feature.id}`,
              icon: feature.icon,
              type: "feature",
            });
          }

          if (submoduleItem.children || features.length === 0) {
            moduleItem.children?.push(submoduleItem);
          }
        }
      } else if (module.views && module.views.length > 0) {
        for (const view of module.views) {
          if (view.route) {
            moduleItem.children?.push({
              id: view.id,
              label: view.name,
              href: view.route,
              icon: view.icon,
              type: "feature",
            });
          }
        }
      }

      if (moduleItem.children && moduleItem.children.length > 0) {
        items.push(moduleItem);
      }
    }

    return items;
  }, [modules, access, user]);

  React.useEffect(() => {
    const findItemsToExpand = (items: NavItem[], targetPath: string): Set<string> => {
      const toExpand = new Set<string>();
      
      const traverse = (item: NavItem): boolean => {
        let hasActive = false;
        
        if (item.href === targetPath) {
          hasActive = true;
        }
        
        if (item.children) {
          for (const child of item.children) {
            if (traverse(child)) {
              hasActive = true;
              toExpand.add(item.id);
            }
          }
        }
        
        return hasActive;
      };
      
      for (const item of items) {
        traverse(item);
      }
      
      return toExpand;
    };

    const itemsToExpand = findItemsToExpand(navItems, pathname);
    setExpandedItems((prev) => {
      const next = new Set(prev);
      itemsToExpand.forEach((id) => next.add(id));
      return next;
    });
  }, [pathname, navItems]);

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


  const renderIcon = (icon?: string, defaultIcon?: React.ReactNode) => {
    if (icon) {
      if (icon.length <= 2 || icon.startsWith("http")) {
        return <span className="text-lg flex-shrink-0 w-5 text-center">{icon}</span>;
      }
      return <span className="text-lg flex-shrink-0 w-5 text-center">{icon}</span>;
    }
    return defaultIcon || <LayoutDashboard className="h-5 w-5 flex-shrink-0" />;
  };

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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderNavItem = (item: NavItem, level = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.href ? pathname === item.href : false;
    const hasActiveChild = item.children?.some(
      (child) => child.href && pathname === child.href
    );

    if (item.href) {
      // Leaf node (feature/view)
      const linkContent = (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "flex items-center gap-2.5 rounded-md text-sm font-medium transition-all duration-200",
            "relative",
            "hover:bg-accent/50 hover:text-foreground",
            isActive
              ? "bg-accent/30 text-foreground font-medium border-l-2 border-primary"
              : "text-muted-foreground",
            isOpen ? "px-2 py-1.5" : "justify-center px-2 py-2"
          )}
        >
          {renderIcon(item.icon)}
          {isOpen && <span className="flex-1 truncate">{item.label}</span>}
        </Link>
      );

      if (!isOpen && hasChildren) {
        return (
          <HoverPopover key={item.id} item={item} isActive={isActive}>
            {linkContent}
          </HoverPopover>
        );
      }

      return linkContent;
    }

    // Parent node (module/submodule)
    const buttonContent = (
      <button
        onClick={() => isOpen && toggleExpanded(item.id)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md text-sm font-medium",
          "transition-all duration-200 ease-in-out",
          "hover:bg-accent/50 hover:text-foreground",
          hasActiveChild
            ? "bg-accent/20 text-foreground font-medium"
            : "text-muted-foreground",
          isOpen ? "px-2 py-1.5" : "justify-center px-2 py-2"
        )}
      >
        {renderIcon(item.icon)}
        {isOpen && (
          <>
            <span className="flex-1 text-left truncate font-semibold">{item.label}</span>
            {hasChildren && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform duration-200 ease-in-out",
                  !isExpanded && "-rotate-90"
                )}
              />
            )}
          </>
        )}
      </button>
    );

    const wrappedContent = !isOpen && hasChildren ? (
      <HoverPopover item={item} isActive={hasActiveChild || false}>
        {buttonContent}
      </HoverPopover>
    ) : (
      buttonContent
    );

    return (
      <div key={item.id} className="relative">
        {wrappedContent}
        {isOpen && isExpanded && hasChildren && (
          <div className={cn(
            "relative mt-0",
            level === 0 && "ml-2",
            level === 1 && "ml-2"
          )}>
            {/* Vertical line that aligns with icon left edge */}
            <div className={cn(
              "absolute top-0 bottom-0 w-0.5 bg-primary/30",
              level === 0 && "left-0",
              level === 1 && "left-0"
            )} />
            {/* Content with padding to align with line */}
            <div className="pl-3">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r flex flex-col",
        "bg-muted/30 backdrop-blur-sm",
        "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isOpen ? "w-64" : "w-16",
        !isOpen && "overflow-visible",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header - Only Logo */}
        <div className="relative flex h-16 items-center justify-center border-b border-border/50 px-4 transition-colors duration-300">
          {/* Toggle Button - Positioned next to header logo */}
          <button
            onClick={() => setIsOpen(!isOpen)}
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

        {/* Navigation */}
        <nav className={cn(
          "flex-1 px-2 py-2",
          isOpen ? "overflow-hidden" : "overflow-visible"
        )}>
          <div className={cn(
            "h-full",
            isOpen ? "overflow-y-auto" : "overflow-visible"
          )}>
            {navItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <LayoutDashboard className="mb-2 h-8 w-8 text-muted-foreground" />
                {isOpen && (
                  <p className="text-sm text-muted-foreground">
                    No modules available
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-0">{navItems.map((item) => renderNavItem(item))}</div>
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={cn("border-t bg-muted/50", !isOpen && "overflow-visible")} data-profile-menu>
          {isOpen ? (
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
                    profileMenuOpen === true && "rotate-180"
                  )}
                />
              </button>

              {profileMenuOpen && (
                <div className="bg-background border rounded-lg shadow-md">
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
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
                {mounted && profileMenuOpen && !isOpen && createPortal(
                <div 
                  className="fixed z-[9999] min-w-[220px] bg-background border rounded-lg shadow-lg"
                  style={{ 
                    top: `${popoverPosition.top}px`,
                    left: `${popoverPosition.left}px`,
                    transform: 'translateY(-90%)'
                  }}
                  onMouseEnter={() => setProfileMenuOpen(true)}
                  onMouseLeave={() => setProfileMenuOpen(false)}
                  data-profile-menu
                >
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
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>,
                document.body
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
