import { cn } from "@/lib/utils/cn";
import type * as React from "react";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ className, children, ...props }: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-[1.618rem] py-[2.618rem] max-w-[1618px]", className)} {...props}>
      {children}
    </div>
  );
}
