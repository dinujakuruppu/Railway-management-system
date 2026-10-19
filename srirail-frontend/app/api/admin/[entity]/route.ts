import { api, ApiError, databaseError, json, readBody } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { noticeSchema, scheduleSchema, trainSchema } from "@/lib/server/validation";
export async function PUT(request: Request, context: {params:Promise<{entity:string}>}) {
  return api(async () => {
    const {client} = await requireAdmin();
    const {entity} = await context.params;
    switch (entity) {
      case "trains": {
        const train = await readBody(request,trainSchema);
        const {error} = await client.rpc("upsert_train",{p_train:train});
        if (error) databaseError(error);
        break;
      }
      case "schedules": {
        const s = await readBody(request,scheduleSchema);
        const {error} = await client.from("schedules").upsert({id:s.id,train_id:s.trainId,days:s.days,active:s.active});
        if (error) databaseError(error);
        break;
      }
      case "notices": {
        const n = await readBody(request,noticeSchema);
        const {error} = await client.from("notices").upsert(n);
        if (error) databaseError(error);
        break;
      }
      default: throw new ApiError(404,"Unknown administration resource.");
    }
    return json({ok:true});
  });
}
