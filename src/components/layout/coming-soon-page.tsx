"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { Construction, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useAccessStore } from "@/lib/access/access-store";

interface ComingSoonPageProps {
  featureName: string;
  featureDescription?: string;
  moduleSlug: string;
  submoduleSlug: string;
  featureSlug: string;
}

/**
 * Coming Soon Page Component
 * 
 * Industry Best Practice: Show a professional "Under Development" page
 * for features that exist in the backend but don't have a frontend implementation yet.
 * 
 * This provides:
 * - Clear communication that the feature is being worked on
 * - Better UX than a generic 404
 * - Professional appearance matching the app's design system
 */
export function ComingSoonPage({
  featureName,
  featureDescription,
  moduleSlug,
  submoduleSlug,
  featureSlug,
}: ComingSoonPageProps) {
  const router = useRouter();
  const getModule = useAccessStore((state) => state.getModule);
  const getSubmodule = useAccessStore((state) => state.getSubmodule);

  const module = React.useMemo(() => getModule(moduleSlug), [getModule, moduleSlug]);
  const submodule = React.useMemo(
    () => getSubmodule(moduleSlug, submoduleSlug),
    [getSubmodule, moduleSlug, submoduleSlug]
  );

  const handleGoBack = () => {
    // Try to go back to parent submodule or module
    if (submodule) {
      router.push(`/${moduleSlug}/${submoduleSlug}`);
    } else if (module) {
      router.push(`/${moduleSlug}`);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Coming Soon</CardTitle>
            <CardDescription className="mt-2">
              This feature is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-center">
              <h3 className="font-semibold text-foreground">{featureName}</h3>
              {featureDescription && (
                <p className="text-sm text-muted-foreground">{featureDescription}</p>
              )}
              {module && submodule && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>{module.name}</span>
                  <span>/</span>
                  <span>{submodule.name}</span>
                  <span>/</span>
                  <span className="font-medium">{featureName}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                variant="default"
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            <div className="mt-6 rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                This feature has been configured in the system but the frontend
                implementation is still in progress. Please check back soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

