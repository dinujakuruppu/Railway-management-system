import { api, databaseError, json, readBody } from "@/lib/server/http";
import { profileFor, requireUser } from "@/lib/server/auth";
import { profileSchema } from "@/lib/server/validation";
export async function PATCH(request: Request) {
  return api(async () => {
    const values = await readBody(request,profileSchema);
    const {client,user} = await requireUser();
    const {error} = await client.from("profiles").update({full_name:values.fullName,identity:values.identity,mobile:values.mobile}).eq("id",user.id);
    if (error) databaseError(error);
    return json({user:await profileFor(client,user.id)});
  });
}
