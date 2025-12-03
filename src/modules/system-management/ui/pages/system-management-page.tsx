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
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header with icon */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Management</h1>
            <p className="text-muted-foreground mt-1">
              Configure permissions, modules, and system structure
            </p>
          </div>
        </div>
        
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-72 flex-shrink-0">
            <Card className="sticky top-4 shadow-md border-border/50">
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 text-left group relative overflow-hidden",
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "hover:bg-accent/60 text-foreground"
                      )}
                    >
                      {/* Active indicator */}
                      {activeSection === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground/50 rounded-r-full" />
                      )}
                      
                      <span className={cn(
                        "mt-0.5 flex-shrink-0 transition-colors p-1.5 rounded-md",
                        activeSection === item.id 
                          ? "text-primary-foreground bg-primary-foreground/10" 
                          : "text-muted-foreground group-hover:text-foreground bg-muted/50"
                      )}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
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
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div 
              key={activeSection}
              className="animate-in fade-in slide-in-from-right-4 duration-200"
            >
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </PageContainer>
  );
}
