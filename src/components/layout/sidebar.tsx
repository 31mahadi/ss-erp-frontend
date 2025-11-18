"use client";

import { hasPermission } from "@/config/permissions";
import { useAuthStore } from "@/lib/auth/auth-store";
import type { FeatureAccessInfo, ModuleAccessInfo } from "@/lib/auth/types";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(true);

  const modules = user?.access?.modules || [];

  const buildNavigationItems = () => {
    const items: Array<{
      label: string;
      href: string;
      icon?: string;
      children?: Array<{ label: string; href: string }>;
    }> = [];

    for (const module of modules) {
      // Support new 4-level structure (submodules -> features)
      if (module.submodules && module.submodules.length > 0) {
        for (const submodule of module.submodules) {
          for (const feature of submodule.features) {
            if (feature.route) {
              // Check if user has read permission for this feature
              const permissionKey = `${module.slug}.${submodule.slug}.${feature.slug}.read`;
              if (user?.access?.hasAllAccess || hasPermission(user?.permissions, permissionKey)) {
                items.push({
                  label: feature.name,
                  href: feature.route,
                  icon: feature.icon,
                });
              }
            }
          }
        }
      }
      // Support old 3-level structure (views)
      else if (module.views && module.views.length > 0) {
        for (const view of module.views) {
          if (view.route) {
            // Check if user has view permission
            const hasViewPermission =
              user?.access?.hasAllAccess ||
              view.permissions.some((perm) => hasPermission(user?.permissions, perm.slug));

            if (hasViewPermission) {
              items.push({
                label: view.name,
                href: view.route,
                icon: view.icon,
              });
            }
          }
        }
      }
    }

    return items;
  };

  const navItems = buildNavigationItems();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-transform",
        isOpen ? "w-64" : "w-16",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-4">
          <h2 className={cn("font-bold", isOpen ? "block" : "hidden")}>SS ERP</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
