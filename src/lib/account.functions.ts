import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Deletes the signed-in user's data and their auth account.
 * Runs with the service role because the client SDK cannot delete auth users.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("user_progress").delete().eq("user_id", userId);
    await supabaseAdmin.from("question_reports").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
