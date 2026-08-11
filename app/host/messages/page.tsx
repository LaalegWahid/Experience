import type { Metadata } from "next";
import { requireProvider } from "@/lib/host";
import { HostInboxAll } from "@/components/host-inbox-all";
import { HostPage } from "@/components/host-page";

export const metadata: Metadata = {
  title: "Messages · Host studio",
};

export default async function HostMessagesPage() {
  // Guard: only an onboarded host reaches this page.
  await requireProvider();

  return (
    <HostPage
      title="Messages"
      description="All your guest conversations, across every listing, in one place."
    >
      <HostInboxAll />
    </HostPage>
  );
}
