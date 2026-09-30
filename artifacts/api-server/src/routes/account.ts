import { Router, type IRouter } from "express";
import { ReplitConnectors } from "@replit/connectors-sdk";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Profile = { id?: unknown; role?: unknown };
type FamilyState = { members?: unknown; dashboardMembers?: unknown };

function isParent(state: FamilyState, profileId: string): boolean {
  const members = [
    ...(Array.isArray(state.members) ? state.members : []),
    ...(Array.isArray(state.dashboardMembers) ? state.dashboardMembers : []),
  ] as Profile[];
  const matches = members.filter((member) => member?.id === profileId);
  return matches.length > 0 && matches.every((member) => member.role === "Parent");
}

router.delete("/account", async (req, res) => {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization ?? "")?.[1];
  if (!token) {
    res.status(401).json({ message: "Sign in to delete your account." });
    return;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    res.status(503).json({ message: "Account deletion is temporarily unavailable." });
    return;
  }

  try {
    // Verify the bearer token with Supabase; never trust an account ID supplied by the client.
    const userResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    });
    if (!userResponse.ok) {
      res.status(401).json({ message: "Your session has expired. Sign in and try again." });
      return;
    }
    const user = (await userResponse.json()) as { id?: string };
    let sessionId: string | undefined;
    try {
      const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { session_id?: string };
      sessionId = claims.session_id;
    } catch {
      // A malformed session cannot authorize deletion.
    }
    if (!user.id || !uuidPattern.test(user.id) || !sessionId || !uuidPattern.test(sessionId)) {
      res.status(401).json({ message: "Your session has expired. Sign in and try again." });
      return;
    }

    const [sessionResponse, familyResponse] = await Promise.all([
      connectors.proxy("supabase", `/rest/v1/family_profile_sessions?select=profile_id,expires_at&user_id=eq.${user.id}&session_id=eq.${sessionId}&limit=1`),
      connectors.proxy("supabase", `/rest/v1/family_states?select=state&user_id=eq.${user.id}&limit=1`),
    ]);
    if (!sessionResponse.ok || !familyResponse.ok) {
      req.log.error({ sessionsStatus: sessionResponse.status, familyStatus: familyResponse.status }, "Unable to verify family permissions");
      res.status(503).json({ message: "Account deletion is temporarily unavailable." });
      return;
    }

    const sessions = (await sessionResponse.json()) as { profile_id: string; expires_at: string }[];
    const families = (await familyResponse.json()) as { state: FamilyState }[];
    const session = sessions[0];
    const validSession = session && (session.expires_at === "infinity" || Date.parse(session.expires_at) > Date.now());
    if (!validSession || !families[0]?.state || !isParent(families[0].state, session.profile_id)) {
      res.status(403).json({ message: "Switch to a Parent profile to delete this account." });
      return;
    }

    // family_states and profile session tables cascade when auth.users is deleted.
    const deleted = await connectors.proxy("supabase", `/auth/v1/admin/users/${user.id}`, { method: "DELETE" });
    if (!deleted.ok) {
      req.log.error({ status: deleted.status }, "Supabase rejected account deletion");
      res.status(503).json({ message: "Could not delete your account. Please try again." });
      return;
    }
    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Account deletion failed");
    res.status(503).json({ message: "Could not delete your account. Please try again." });
  }
});

export default router;