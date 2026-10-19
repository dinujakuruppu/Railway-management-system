import { api, ApiError, checkOrigin, json, readBody } from "@/lib/server/http";
import { createClient } from "@/lib/supabase/server";
import { backendConfig } from "@/lib/server/config";
import { requireUser } from "@/lib/server/auth";
import { emailSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/server/validation";
export async function POST(request: Request, context: { params: Promise<{action:string}> }) {
  return api(async () => {
    const {action} = await context.params;
    checkOrigin(request);
    const {origin} = backendConfig();
    const client = await createClient();
    switch (action) {
      case "login": {
        const values = await readBody(request,loginSchema);
        const {error} = await client.auth.signInWithPassword(values);
        if (error) throw new ApiError(error.status === 429 ? 429 : 401, error.status === 429 ? "Too many attempts. Please try again later." : "Sign-in failed. Check your email, password and email confirmation.");
        return json({ok:true});
      }
      case "register": {
        const values = await readBody(request,registerSchema);
        const {error} = await client.auth.signUp({email:values.email,password:values.password,options:{
          emailRedirectTo:`${origin}/auth/callback`,
          data:{full_name:values.fullName,identity:values.identity,mobile:values.mobile},
        }});
        if (error) throw new ApiError(error.status === 429 ? 429 : 400,"Account registration could not be completed. Please check your details or try again later.");
        return json({message:"Check your email to confirm your account, then sign in. If you already have an account, use sign in or reset your password."});
      }
      case "forgot-password": {
        const {email} = await readBody(request,emailSchema);
        await client.auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/callback?next=/reset-password`});
        return json({message:"If this address has an account, a password reset email has been sent. Check your inbox and spam folder."});
      }
      case "update-password": {
        const {password} = await readBody(request,passwordSchema);
        const auth = await requireUser();
        const {error} = await auth.client.auth.updateUser({password});
        if (error) throw new ApiError(400,"Password could not be updated. Use a different password or request a new reset link.");
        await auth.client.auth.signOut({scope:"global"});
        return json({message:"Password updated. Sign in with your new password."});
      }
      case "logout": {
        const {error} = await client.auth.signOut({scope:"local"});
        if (error) throw new ApiError(503,"Sign out could not be completed. Try again.");
        return json({ok:true});
      }
      default: throw new ApiError(404,"Unknown authentication action.");
    }
  });
}
