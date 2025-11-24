"use client";

import { useAccessStore } from "@/lib/access/access-store";
import { useAuthStore } from "@/lib/auth/auth-store";
import { cn } from "@/lib/utils/cn";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "../ui/button";

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

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  // Subscribe directly to the access property to ensure reactivity
  const access = useAccessStore((state) => state.access);
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(true);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set()
  );

  // Get modules from access - this will trigger re-render when access changes
  const modules = React.useMemo(() => {
    const mods = access?.modules ?? [];
    // Debug: Log to see what we're getting
    if (process.env.NODE_ENV === 'development') {
      console.log('Sidebar modules:', mods);
      mods.forEach((mod) => {
        console.log(`Module ${mod.name}:`, {
          submodules: mod.submodules?.length || 0,
          features: mod.submodules?.reduce((sum, sm) => sum + (sm.features?.length || 0), 0) || 0,
        });
      });
    }
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

    // Always show Dashboard
    items.push({
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      type: "feature",
    });

    // Always show System Management for Root Admin, Super Admin, or Admin if they have all access
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

      // Support new 4-level structure (submodules -> features)
      if (module.submodules && module.submodules.length > 0) {
        for (const submodule of module.submodules) {
          const submoduleItem: NavItem = {
            id: submodule.id,
            label: submodule.name,
            icon: submodule.icon,
            type: "submodule",
            children: [],
          };

          // Ensure features array exists and iterate through all features
          const features = submodule.features || [];
          if (process.env.NODE_ENV === 'development' && features.length === 0 && submodule.id) {
            console.warn(`Submodule ${submodule.name} (${submodule.id}) has no features`);
          }
          for (const feature of features) {
            // Show all features, even if they don't have a route
            // Features without routes can still be accessed via their ID or slug
            submoduleItem.children?.push({
              id: feature.id,
              label: feature.name,
              href: feature.route || `#${feature.slug || feature.id}`,
              icon: feature.icon,
              type: "feature",
            });
          }
          
          // Debug: Log features for this submodule
          if (process.env.NODE_ENV === 'development' && features.length > 0) {
            console.log(`Submodule ${submodule.name} features:`, features.map(f => f.name));
          }

          // Add submodule if it has features OR if it exists (even without features)
          // This ensures submodules are visible even if they don't have features yet
          if (submoduleItem.children && submoduleItem.children.length > 0) {
            moduleItem.children?.push(submoduleItem);
          }
        }
      }
      // Support old 3-level structure (views)
      else if (module.views && module.views.length > 0) {
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

  // Auto-expand items that contain the active route
  React.useEffect(() => {
    const findItemsToExpand = (items: NavItem[], targetPath: string): Set<string> => {
      const toExpand = new Set<string>();
      
      const traverse = (item: NavItem): boolean => {
        let hasActive = false;
        
        // Check if this item is active
        if (item.href === targetPath) {
          hasActive = true;
        }
        
        // Check children
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
      // If icon is an emoji or simple string, render it directly
      if (icon.length <= 2 || icon.startsWith("http")) {
        return <span className="text-lg">{icon}</span>;
      }
      // Otherwise, try to use as a component name (for future icon library integration)
      return <span className="text-lg">{icon}</span>;
    }
    return defaultIcon || <LayoutDashboard className="h-5 w-5" />;
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
      return (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground",
            level > 0 && "ml-4"
          )}
        >
          {renderIcon(item.icon)}
          {isOpen && <span className="flex-1">{item.label}</span>}
        </Link>
      );
    }

    // Parent node (module/submodule)
    return (
      <div key={item.id} className="space-y-1">
        <button
          onClick={() => toggleExpanded(item.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
            "hover:bg-accent hover:text-accent-foreground",
            hasActiveChild && !isActive
              ? "bg-accent/50 text-accent-foreground"
              : "text-foreground",
            level > 0 && "ml-4"
          )}
        >
          {renderIcon(item.icon)}
          {isOpen && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {hasChildren &&
                (isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </>
          )}
        </button>
        {isOpen && isExpanded && hasChildren && (
          <div className="ml-2 space-y-1 border-l border-border pl-2">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        isOpen ? "w-72" : "w-16",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {isOpen && (
            <h2 className="text-lg font-bold text-foreground">SS ERP</h2>
          )}
          {!isOpen && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">SS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8"
          >
            {isOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
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
            <div className="space-y-1">{navItems.map((item) => renderNavItem(item))}</div>
          )}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="border-t p-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SS ERP
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
