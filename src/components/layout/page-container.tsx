import { cn } from "@/lib/utils/cn";
import type * as React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div className={cn("w-full max-w-full overflow-x-hidden", className)} {...props}>
      {children}
    </div>
  );
}
