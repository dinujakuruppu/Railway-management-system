import { api, databaseError, json } from "@/lib/server/http";
import { profileFor, session } from "@/lib/server/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(async () => {
    const {client,user,role} = await session();
    const catalog = await client.rpc("catalog");
    if (catalog.error) databaseError(catalog.error);
    const bookings = user ? await client.rpc("get_bookings", { p_own_only: true }) : { data: [], error: null };
    if (bookings.error) databaseError(bookings.error);
    const adminBookings = role === "admin" ? await client.rpc("get_bookings", { p_own_only: false }) : {data:[],error:null};
    if (adminBookings.error) databaseError(adminBookings.error);
    return json({ ...catalog.data, user: user ? await profileFor(client,user.id) : null, role, bookings:bookings.data, adminBookings:adminBookings.data });
  });
}
