import { redirect } from "next/navigation";

// The host landing is now the site root. Redirect the old path so existing
// links and search results keep working.
export default function HostAnExperiencePage() {
  redirect("/");
}
