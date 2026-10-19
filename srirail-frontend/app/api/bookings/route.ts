import { api, databaseError, json, readBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { bookingSchema } from "@/lib/server/validation";
export async function GET() {
  return api(async () => {
    const {client} = await requireUser();
    const {data,error} = await client.rpc("get_bookings",{p_own_only:true});
    if (error) databaseError(error);
    return json({bookings:data});
  });
}
export async function POST(request: Request) {
  return api(async () => {
    const {method,...values} = await readBody(request,bookingSchema);
    const {client} = await requireUser();
    const {data,error} = await client.rpc("create_booking",{p_request:{...values,paymentMethod:method}});
    if (error) databaseError(error);
    return json({booking:data},201);
  });
}
