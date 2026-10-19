import { api, checkOrigin, databaseError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { z } from "zod";
export async function POST(request: Request, context: {params:Promise<{id:string}>}) {
  return api(async () => {
    checkOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const {client} = await requireUser();
    const {data,error} = await client.rpc("cancel_booking",{p_booking_id:id});
    if (error) databaseError(error);
    return json({booking:data});
  });
}
