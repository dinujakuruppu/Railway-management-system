import { api, databaseError, json } from "@/lib/server/http";
import { createClient } from "@/lib/supabase/server";
import { classId, identifier, travelDate } from "@/lib/server/validation";
export async function GET(request: Request) {
  return api(async () => {
    const params = new URL(request.url).searchParams;
    const trainId = identifier.parse(params.get("trainId"));
    const date = travelDate.parse(params.get("date"));
    const selectedClass = classId.parse(params.get("classId"));
    const client = await createClient();
    const {data,error} = await client.rpc("get_availability",{p_train_id:trainId,p_date:date,p_class_id:selectedClass});
    if (error) databaseError(error);
    return json(data);
  });
}
