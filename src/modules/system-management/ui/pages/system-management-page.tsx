"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import * as React from "react";
import { ModulesTab } from "../tabs/modules-tab";
import { SubmodulesTab } from "../tabs/submodules-tab";
import { FeaturesTab } from "../tabs/features-tab";
import { OperationsTab } from "../tabs/operations-tab";
import { RolesTab } from "../tabs/roles-tab";
import { RoleAccessTab } from "../tabs/role-access-tab";

type Tab = "modules" | "submodules" | "features" | "operations" | "roles" | "role-access";

export function SystemManagementPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>("modules");

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "modules", label: "Modules" },
    { id: "submodules", label: "Submodules" },
    { id: "features", label: "Features" },
    { id: "operations", label: "Operations" },
    { id: "roles", label: "Roles" },
    { id: "role-access", label: "Role Access" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="System Management"
        description="Manage modules, submodules, features, operations, and role access control"
      />
      <Card>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="flex space-x-1 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {activeTab === "modules" && <ModulesTab />}
            {activeTab === "submodules" && <SubmodulesTab />}
            {activeTab === "features" && <FeaturesTab />}
            {activeTab === "operations" && <OperationsTab />}
            {activeTab === "roles" && <RolesTab />}
            {activeTab === "role-access" && <RoleAccessTab />}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

