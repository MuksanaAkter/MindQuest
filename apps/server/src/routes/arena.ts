import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "../session";
import { actOnRound, ArenaError, overview, readRound, startRound, type Owner } from "../games/knowledge/service";
const configSchema = z.object({ category: z.enum(["mixed", "science", "world", "history"]), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), timed: z.boolean(), daily: z.boolean() }).strict();
const actionSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("answer"), questionId: z.string().max(100), choiceId: z.string().uuid().nullable() }).strict(), z.object({ action: z.literal("next"), questionId: z.string().max(100) }).strict()]);
export async function guestIdentity() {
  const jar = await cookies(); let guest = jar.get("mq_guest")?.value;
  if (!guest || !z.string().uuid().safeParse(guest).success) {
    guest = randomUUID();
    jar.set("mq_guest", guest, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 180, path: "/" });
  }
  return `guest:${guest}`;
}
async function owner(): Promise<Owner> {
  const guestKey = await guestIdentity(); const session = await getSession();
  if (session) return { key: `user:${session.user.id}`, userId: session.user.id, name: session.user.name, guestKey };
  return { key: guestKey, userId: null, name: "Adventurer" };
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.BETTER_AUTH_URL;
  if (origin && origin !== new URL(request.url).origin && (!allowed || origin !== new URL(allowed).origin)) throw new ArenaError(403, "This request origin is not allowed.");
}
export async function guarded(run: () => Promise<unknown>) {
  try { return Response.json(await run(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    if (error instanceof ArenaError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid request JSON." }, { status: 400 });
    console.error("Arena request failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: "The arena is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
}
export async function GET() { return guarded(async () => overview(await owner())); }
export async function POST(request: Request) { return guarded(async () => { checkOrigin(request); const config = configSchema.parse(await request.json()); return startRound(await owner(), config); }); }
export async function GET_ATTEMPT(_request: Request, context: { params: Promise<{ id: string }> }) { return guarded(async () => readRound(await owner(), (await context.params).id)); }
export async function POST_ATTEMPT(request: Request, context: { params: Promise<{ id: string }> }) { return guarded(async () => { checkOrigin(request); const action = actionSchema.parse(await request.json()); return actOnRound(await owner(), (await context.params).id, action); }); }
