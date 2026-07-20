import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server-client";

// Single hardcoded owner, not a roles table — this is a genuine one-admin
// store. Must be called independently at the top of every admin Server
// Action, not just from the /admin layout: actions are directly POST-able
// regardless of which page rendered the form that called them.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.email !== process.env.ADMIN_EMAIL) notFound();

  return user;
}
