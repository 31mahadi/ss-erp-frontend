import { NotFoundPage } from "@/components/layout/not-found-page";

/**
 * Root-level 404 page for Next.js App Router
 * This handles 404s for routes outside the (private) group
 */
export default function RootNotFound() {
  return <NotFoundPage />;
}

