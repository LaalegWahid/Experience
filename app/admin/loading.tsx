import { ContentSkeleton } from "@/components/skeleton";

// Covers all /admin/* pages; the admin layout chrome stays mounted around this.
export default function Loading() {
  return <ContentSkeleton variant="list" rows={5} />;
}
