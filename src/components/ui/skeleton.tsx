import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/70 shimmer",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton for text content with multiple lines
 */
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card content
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * Skeleton for table rows
 */
function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-muted/30 rounded-t-lg">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 px-4 py-3 border-b border-border/50"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-1/4 flex-none"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for sidebar navigation
 */
function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 h-screen border-r bg-muted/20 p-4 space-y-4", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 py-4 border-b">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      {/* Nav items */}
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      
      {/* User section at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for page header
 */
function SkeletonPageHeader({ className }: { className?: string }) {
  return (
    <div className={cn("mb-6 space-y-2", className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/**
 * Skeleton for dashboard layout
 */
function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      <SkeletonSidebar />
      <div className="flex-1 p-6 space-y-6">
        <SkeletonPageHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center bg-background", className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonSidebar,
  SkeletonPageHeader,
  SkeletonDashboard,
  SkeletonPage,
};
