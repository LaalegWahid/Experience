import { redirect } from "next/navigation";

// Auth is now a popup (see components/auth-modal). This route is kept so all the
// existing /register links keep working — it bounces to the home page with
// ?auth=signup so the global provider opens the popup there.
export default async function RegisterPage(props: PageProps<"/register">) {
  const sp = await props.searchParams;
  const params = new URLSearchParams({ auth: "signup" });
  const r = typeof sp.redirect === "string" ? sp.redirect : "";
  if (r) params.set("redirect", r);
  redirect(`/?${params.toString()}`);
}
