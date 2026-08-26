import { PageSkeleton } from "@/components/skeleton";

// Covers /account/settings, /account/invoices, and /account/payment-methods.
export default function Loading() {
  return <PageSkeleton width="max-w-3xl" variant="list" rows={4} />;
}
