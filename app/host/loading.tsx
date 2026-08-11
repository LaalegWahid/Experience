import { ContentSkeleton } from "@/components/skeleton";

// Covers all /host/* pages; the host layout chrome stays mounted around this.
export default function Loading() {
  return <ContentSkeleton variant="list" rows={4} />;
}
