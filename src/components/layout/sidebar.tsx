"use client";

import { useAccessStore } from "@/lib/access/access-store";
import { useAuthStore } from "@/lib/auth/auth-store";
import { cn } from "@/lib/utils/cn";
import {
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useSidebar } from "./sidebar-context";
import { SidebarHeader, SidebarUserProfile, HoverPopover, type NavItem } from "./sidebar/index";
import { useLocalStorageSet, createStorageKey } from "@/lib/hooks";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const access = useAccessStore((state) => state.access);
  const { user, logout } = useAuthStore();
  const { isOpen, setIsOpen, toggle } = useSidebar();
  
  // Persist sidebar expanded items in localStorage (survives refresh)
  const [expandedItems, setExpandedItems] = useLocalStorageSet<string>(
    createStorageKey("sidebar", "expanded-items")
  );
  
  // Scroll indicator state
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = React.useState(false);
  
  // Check scroll position
  const checkScrollPosition = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen) {
      setShowScrollIndicator(false);
      return;
    }
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollable = scrollHeight > clientHeight;
    const isNotAtBottom = scrollTop + clientHeight < scrollHeight - 10; // 10px threshold
    
    setShowScrollIndicator(isScrollable && isNotAtBottom);
  }, [isOpen]);
  
  // Monitor scroll events
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen) {
      setShowScrollIndicator(false);
      return;
    }
    
    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    
    // Also check when content changes (e.g., items expand/collapse)
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);
    
    // Check on window resize
    window.addEventListener('resize', checkScrollPosition);
    
    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition, isOpen]);

  const modules = React.useMemo(() => {
    return access?.modules ?? [];
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

  // Re-check scroll position when nav items or expanded items change
  React.useEffect(() => {
    if (isOpen) {
      // Small delay to allow DOM to update
      const timer = setTimeout(() => {
        checkScrollPosition();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [navItems, expandedItems, isOpen, checkScrollPosition]);

  // Auto-expand items based on current path
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

  const renderIcon = (icon?: string, defaultIcon?: React.ReactNode) => {
    if (icon) {
      return <span className="text-lg flex-shrink-0 w-5 text-center">{icon}</span>;
    }
    return defaultIcon || <LayoutDashboard className="h-5 w-5 flex-shrink-0" />;
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
        "fixed left-0 top-0 z-40 h-screen border-r border-border/60 flex flex-col",
        "bg-muted/30 backdrop-blur-sm",
        "transition-all duration-300 ease-smooth",
        // Mobile: overlay sidebar, tablet+: fixed sidebar
        "lg:translate-x-0",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-16",
        !isOpen && "overflow-visible",
        className
      )}
    >
      <div className="flex h-full flex-col min-h-0">
        {/* Header - fixed height to prevent flickering */}
        <div className="flex-shrink-0 h-16">
          <SidebarHeader isOpen={isOpen} onToggle={toggle} />
        </div>

        {/* Navigation - flex-1 with min-h-0 to prevent overflow issues */}
        <nav className={cn(
          "flex-1 min-h-0 px-2 py-2 relative",
          isOpen ? "overflow-hidden" : "overflow-visible"
        )}>
          <div 
            ref={scrollContainerRef}
            className={cn(
            "h-full",
              isOpen ? "overflow-y-auto overflow-x-hidden scrollbar-hide" : "overflow-visible"
            )}
          >
            {navItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center min-h-[200px]">
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
          
          {/* Scroll Indicator - Animated down arrow */}
          {isOpen && showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none z-10 pb-1">
              <div className="animate-bounce">
                <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section - fixed height to prevent flickering */}
        <div className="flex-shrink-0">
          <SidebarUserProfile 
            user={user} 
            isOpen={isOpen} 
            onLogout={handleLogout} 
          />
        </div>
      </div>
    </aside>
  );
}
