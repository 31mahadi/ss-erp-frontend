"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth/auth-store";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Activity,
  TrendingUp,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.firstName || user?.email?.split("@")[0] || "User";
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  const quickStats = [
    {
      title: "Total Modules",
      value: user?.access?.modules?.length || 0,
      description: "Active modules",
      icon: LayoutDashboard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Sessions",
      value: 1,
      description: "Current session",
      icon: Activity,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "User Roles",
      value: user?.roles?.length || 0,
      description: "Assigned roles",
      icon: Users,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Permissions",
      value: user?.access?.hasAllAccess ? "Full" : "Custom",
      description: "Access level",
      icon: Settings,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight mb-2">
              {greeting}, <span className="text-primary">{firstName}</span>!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Welcome to SS ERP system. Here's an overview of your workspace and recent activity.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
          {quickStats.map((stat, index) => (
            <Card key={index} className="card-hover overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Activity Section */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">No recent activity to display</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Your activity will appear here</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.access?.hasAllAccess && (
                <a 
                  href="/system-management"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">System Management</p>
                    <p className="text-xs text-muted-foreground">Configure modules & permissions</p>
                  </div>
                </a>
              )}
              <a 
                href="/profile"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
              >
                <div className="p-2 rounded-md bg-accent group-hover:bg-accent/80 transition-colors">
                  <Users className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">View Profile</p>
                  <p className="text-xs text-muted-foreground">Manage your account settings</p>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
