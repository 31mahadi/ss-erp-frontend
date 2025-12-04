"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import * as React from "react";
import { StructureManagementTab } from "../tabs/structure-management-tab";
import { RoleManagementTab } from "../tabs/role-management-tab";
import { UserManagementTab } from "../tabs/user-management-tab";
import { 
  FolderTree, 
  Shield, 
  UserCog,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUrlState } from "@/lib/hooks";

type Section = "structure" | "roles" | "users";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: "structure",
    label: "Structure",
    icon: <FolderTree className="h-5 w-5" />,
    description: "Manage modules, submodules, features & operations",
  },
  {
    id: "roles",
    label: "Roles",
    icon: <Shield className="h-5 w-5" />,
    description: "Create & manage roles with permissions",
  },
  {
    id: "users",
    label: "Users",
    icon: <UserCog className="h-5 w-5" />,
    description: "Manage users, roles & explicit permissions",
  },
];

export function SystemManagementPage() {
  // Persist active tab in URL (shareable, bookmarkable)
  const [activeSection, setActiveSection] = useUrlState<Section>("tab", "structure");

  const renderContent = () => {
    switch (activeSection) {
      case "structure":
        return <StructureManagementTab />;
      case "roles":
        return <RoleManagementTab />;
      case "users":
        return <UserManagementTab />;
      default:
        return <StructureManagementTab />;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
        {/* Header with icon */}
        <div className="flex items-start gap-3 w-full">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight break-words">System Management</h1>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              Configure permissions, modules, and system structure
            </p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full max-w-full">
          {/* Sidebar Navigation - Horizontal on mobile, vertical on desktop */}
          <aside className="w-full lg:w-64 flex-shrink-0 max-w-full">
            <Card className="shadow-md border-border/50 w-full">
              <CardContent className="p-2 sm:p-2.5">
                <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1 w-full">
                  <div className="flex flex-row lg:flex-col gap-2 lg:gap-1 w-full lg:w-auto overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "flex items-center lg:items-start gap-2 lg:gap-3 p-2.5 lg:p-3 rounded-lg transition-all duration-200 text-left group relative overflow-hidden",
                          "lg:w-full flex-shrink-0",
                      activeSection === item.id
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "hover:bg-accent/60 text-foreground"
                        )}
                  >
                        {/* Active indicator */}
                    {activeSection === item.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground/50 rounded-r-full hidden lg:block" />
                    )}
                        
                        <span className={cn(
                          "flex-shrink-0 transition-colors p-1.5 rounded-md",
                      activeSection === item.id 
                            ? "text-primary-foreground bg-primary-foreground/10" 
                            : "text-muted-foreground group-hover:text-foreground bg-muted/50"
                        )}>
                      {item.icon}
                    </span>
                        <div className="flex-1 min-w-0 hidden lg:block">
                          <div className={cn(
                            "font-semibold text-sm transition-colors",
                        activeSection === item.id ? "text-primary-foreground" : ""
                          )}>
                        {item.label}
                      </div>
                          <div className={cn(
                            "text-xs mt-0.5 transition-colors leading-relaxed",
                        activeSection === item.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                          )}>
                        {item.description}
                      </div>
                    </div>
                        {/* Mobile: show label only */}
                        <span className="lg:hidden text-sm font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                  </button>
                ))}
                  </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
          <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden">
            <div 
              key={activeSection}
              className="animate-in fade-in slide-in-from-right-4 duration-200 w-full"
            >
              {renderContent()}
            </div>
          </main>
          </div>
      </div>
    </PageContainer>
  );
}
