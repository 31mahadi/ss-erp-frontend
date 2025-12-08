"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase } from "lucide-react";
import { DepartmentManagement } from "@/modules/config/ui/components/department-management";
import { PositionManagement } from "@/modules/config/ui/components/position-management";
import { useUrlState } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import * as React from "react";

type ConfigTab = "departments" | "positions";

export function ConfigManagementTab() {
  const [activeTab, setActiveTab] = useUrlState<ConfigTab>("configTab", "departments");

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">System Configuration</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Manage system master data and configuration settings
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab("departments")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === "departments"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="h-4 w-4" />
                Departments
              </button>
              <button
                onClick={() => setActiveTab("positions")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                  activeTab === "positions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Briefcase className="h-4 w-4" />
                Positions
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {activeTab === "departments" && <DepartmentManagement />}
              {activeTab === "positions" && <PositionManagement />}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

