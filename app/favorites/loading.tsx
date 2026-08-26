import { PageSkeleton } from "@/components/skeleton";

export default function Loading() {
  return <PageSkeleton width="max-w-6xl" variant="cards" rows={6} />;
}
