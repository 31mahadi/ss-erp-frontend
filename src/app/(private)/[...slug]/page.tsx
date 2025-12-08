"use client";

import { usePathname } from "next/navigation";
import { useAccessStore } from "@/lib/access/access-store";
import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { NotFoundPage } from "@/components/layout/not-found-page";
import * as React from "react";

/**
 * Catch-all route handler for dynamic feature routes
 * 
 * This handles routes like:
 * - /hr/employee/list
 * - /finance/invoices/create
 * - etc.
 * 
 * Industry Best Practice:
 * - If feature exists in backend but frontend page doesn't exist → Show "Coming Soon"
 * - If route doesn't match any feature → Show 404
 * 
 * This provides better UX than a generic 404 for features that are
 * configured in the backend but still under development.
 */
export default function DynamicFeaturePage() {
  const pathname = usePathname();
  const access = useAccessStore((state) => state.access);
  const getFeature = useAccessStore((state) => state.getFeature);

  // Parse the pathname to extract module/submodule/feature slugs
  // Example: /hr/employee/list -> ['hr', 'employee', 'list']
  const pathSegments = React.useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean) // Remove empty strings
      .map((segment) => segment.toLowerCase());
  }, [pathname]);

  // Find matching feature in the access store
  // We need at least 3 segments: module/submodule/feature
  // If feature exists but route is not set or doesn't match, it's under development
  const feature = React.useMemo(() => {
    if (pathSegments.length < 3) return null; // Need at least module/submodule/feature

    const [moduleSlug, submoduleSlug, featureSlug] = pathSegments;
    const foundFeature = getFeature(moduleSlug, submoduleSlug, featureSlug);
    
    // If feature exists, it means it's configured in backend
    // If route is not set or doesn't match current pathname, it's under development
    if (foundFeature) {
      // Route not set = under development
      // Route set but doesn't match = might be a different route, but feature exists
      // In both cases, show "Coming Soon" since feature exists in backend
      return foundFeature;
    }
    
    return null;
  }, [pathSegments, getFeature]);

  // If feature exists in backend, show "Coming Soon"
  // This means the feature is configured but frontend page is not yet implemented
  if (feature) {
    return (
      <ComingSoonPage
        featureName={feature.name}
        featureDescription={feature.description}
        moduleSlug={pathSegments[0]}
        submoduleSlug={pathSegments[1]}
        featureSlug={pathSegments[2]}
      />
    );
  }

  // If no feature found, show 404
  return <NotFoundPage pathname={pathname} />;
}

