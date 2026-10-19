import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApiError, databaseError } from "@/lib/server/http";

export async function session() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { client, user: null, role: "passenger" as const };
  const roles = await client.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  if (roles.error) databaseError(roles.error);
  const role: "admin" | "passenger" = roles.data?.role === "admin" ? "admin" : "passenger";
  return { client, user, role };
}
export async function requireUser() {
  const auth = await session();
  if (!auth.user) throw new ApiError(401, "Please sign in to continue.");
  return { ...auth, user: auth.user };
}
export async function requireAdmin() {
  const auth = await requireUser();
  if (auth.role !== "admin") throw new ApiError(403, "Administrator access is required.");
  return auth;
}
export async function requirePageUser() {
  let auth;
  try { auth = await session(); } catch { redirect("/login"); }
  if (!auth.user) redirect("/login");
  return auth;
}
export async function requirePageAdmin() {
  const auth = await requirePageUser();
  if (auth.role !== "admin") redirect("/dashboard");
  return auth;
}
export async function profileFor(client: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await client.from("profiles").select("id,full_name,identity,email,mobile").eq("id", userId).single();
  if (error || !data) databaseError(error);
  return { id: data.id, fullName: data.full_name, identity: data.identity, email: data.email, mobile: data.mobile };
}
