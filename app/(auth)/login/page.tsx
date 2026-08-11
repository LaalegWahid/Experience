import { redirect } from "next/navigation";

// Auth is now a popup (see components/auth-modal). This route is kept so all the
// existing /login?redirect=… links keep working — it bounces to the home page
// with ?auth=login so the global provider opens the popup there.
export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const params = new URLSearchParams({ auth: "login" });
  const r = typeof sp.redirect === "string" ? sp.redirect : "";
  if (r) params.set("redirect", r);
  const err = typeof sp.error === "string" ? sp.error : "";
  if (err) params.set("error", err);
  redirect(`/?${params.toString()}`);
}
