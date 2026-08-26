import { PageSkeleton } from "@/components/skeleton";

export default function Loading() {
  return <PageSkeleton width="max-w-3xl" variant="list" rows={5} />;
}
