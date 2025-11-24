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
  UserCog
} from "lucide-react";

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
  const [activeSection, setActiveSection] = React.useState<Section>("structure");

  const activeItem = navItems.find((item) => item.id === activeSection);

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
      <PageHeader
        title="System Management"
        description="Configure permissions, modules, and system structure"
      />
      
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left group relative ${
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-accent/50 text-foreground"
                    }`}
                  >
                    {activeSection === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                    )}
                    <span className={`mt-0.5 flex-shrink-0 transition-colors ${
                      activeSection === item.id 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm transition-colors ${
                        activeSection === item.id ? "text-primary-foreground" : ""
                      }`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-0.5 transition-colors ${
                        activeSection === item.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}>
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
          <div className="space-y-6">
            {/* Content */}
            <div className="animate-in fade-in-50 duration-200">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </PageContainer>
  );
}
