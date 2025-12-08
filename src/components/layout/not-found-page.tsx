"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotFoundPageProps {
  pathname?: string;
}

/**
 * 404 Not Found Page Component
 * 
 * Shows when a route doesn't match any feature in the system.
 * This is different from "Coming Soon" which shows when a feature
 * exists in backend but frontend page doesn't exist.
 */
export function NotFoundPage({ pathname }: NotFoundPageProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">404 - Page Not Found</CardTitle>
            <CardDescription className="mt-2">
              The page you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pathname && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {pathname}
                </p>
              </div>
            )}

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
                If you believe this is an error, please contact your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

