import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock: Supabase query builder -------------------------------------------
// Each supabase.from(...) query is recorded and, when awaited, resolves to
// the next result in `db.results` (or an empty success).

type DbResult = { data?: unknown; error: { code?: string; message: string } | null };
type Call = { method: string; args: unknown[] };

const db = {
  results: [] as DbResult[],
  queries: [] as Call[][],
};

const CHAIN_METHODS = ["select", "upsert", "maybeSingle", "single"];

function query(table: string) {
  const calls: Call[] = [{ method: "from", args: [table] }];
  db.queries.push(calls);
  const chain: Record<string, unknown> = {};
  for (const method of CHAIN_METHODS) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }
  chain.then = (resolve: (value: DbResult) => unknown) => resolve(db.results.shift() ?? { data: null, error: null });
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: query }) }));

const { getSettings, saveSettings } = await import("@/app/settings/actions");

// --- Helpers -----------------------------------------------------------------

function call(query: Call[], method: string): Call | undefined {
  return query.find((c) => c.method === method);
}

beforeEach(() => {
  db.results = [];
  db.queries = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// --- Tests -------------------------------------------------------------------

describe("getSettings", () => {
  it("reads the user's limits", async () => {
    db.results.push({ data: { caffeine_limit_mg: 400, nicotine_limit_mg: null }, error: null });

    const result = await getSettings();

    expect(result).toEqual({ ok: true, settings: { caffeineLimitMg: 400, nicotineLimitMg: null } });
    const [q] = db.queries;
    expect(call(q, "from")?.args).toEqual(["user_settings"]);
    expect(call(q, "select")?.args).toEqual(["caffeine_limit_mg, nicotine_limit_mg"]);
    expect(call(q, "maybeSingle")).toBeDefined();
  });

  it("gives no limits when the user has not saved any yet", async () => {
    db.results.push({ data: null, error: null });

    expect(await getSettings()).toEqual({ ok: true, settings: { caffeineLimitMg: null, nicotineLimitMg: null } });
  });

  it("asks to sign in when the user has no session", async () => {
    db.results.push({ data: null, error: { code: "42501", message: "permission denied for table user_settings" } });

    expect(await getSettings()).toEqual({ ok: false, message: "Logi sisse, et päevalimiite salvestada ja näha." });
  });

  it("does not leak the database error", async () => {
    db.results.push({ data: null, error: { code: "XX000", message: "internal error at row 7" } });

    const result = await getSettings();

    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).not.toMatch(/internal/);
  });
});

describe("saveSettings", () => {
  it("upserts only the limit columns and returns what was stored", async () => {
    db.results.push({ data: { caffeine_limit_mg: 400, nicotine_limit_mg: null }, error: null });

    const result = await saveSettings({ caffeineLimitMg: 400, nicotineLimitMg: null });

    expect(result).toEqual({ ok: true, settings: { caffeineLimitMg: 400, nicotineLimitMg: null } });
    const [q] = db.queries;
    expect(call(q, "from")?.args).toEqual(["user_settings"]);
    expect(call(q, "upsert")?.args).toEqual([
      { caffeine_limit_mg: 400, nicotine_limit_mg: null },
      { onConflict: "user_id" },
    ]);
    expect(call(q, "single")).toBeDefined();
  });

  it("never sends a user id, even if the browser adds one", async () => {
    db.results.push({ data: { caffeine_limit_mg: 400, nicotine_limit_mg: null }, error: null });

    await saveSettings({ caffeineLimitMg: 400, nicotineLimitMg: null, user_id: "someone-else" } as never);

    expect(call(db.queries[0], "upsert")?.args[0]).not.toHaveProperty("user_id");
  });

  it("clears both limits with null", async () => {
    db.results.push({ data: { caffeine_limit_mg: null, nicotine_limit_mg: null }, error: null });

    const result = await saveSettings({ caffeineLimitMg: null, nicotineLimitMg: null });

    expect(result).toEqual({ ok: true, settings: { caffeineLimitMg: null, nicotineLimitMg: null } });
  });

  it("rejects invalid limits without touching the database", async () => {
    const result = await saveSettings({ caffeineLimitMg: 5000, nicotineLimitMg: 2.5 });

    expect(result).toEqual({
      ok: false,
      message: "Limiidid on vigased. Paranda märgitud väljad.",
      fieldErrors: {
        caffeineLimitMg: "Limiit peab olema 1–2000 mg.",
        nicotineLimitMg: "Sisesta täisarv milligrammides või jäta tühjaks.",
      },
    });
    expect(db.queries).toHaveLength(0);
  });

  it("asks to sign in when row level security refuses", async () => {
    db.results.push({ data: null, error: { code: "42501", message: "new row violates row-level security policy" } });

    expect(await saveSettings({ caffeineLimitMg: 400, nicotineLimitMg: null })).toEqual({
      ok: false,
      message: "Logi sisse, et päevalimiite salvestada ja näha.",
    });
  });

  it("does not leak the database error", async () => {
    db.results.push({ data: null, error: { code: "XX000", message: "internal error at row 7" } });

    expect(await saveSettings({ caffeineLimitMg: 400, nicotineLimitMg: null })).toEqual({
      ok: false,
      message: "Päevalimiitide salvestamine ebaõnnestus. Proovi uuesti.",
    });
  });
});
