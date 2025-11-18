import { cn } from "@/lib/utils/cn";
import type * as React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6 max-w-7xl", className)} {...props}>
      {children}
    </div>
  );
}
