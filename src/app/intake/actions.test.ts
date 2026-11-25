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

const CHAIN_METHODS = ["insert", "delete", "select", "eq", "gte", "lte", "order", "limit", "single"];

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

const actions = await import("@/app/intake/actions");

// --- Helpers -----------------------------------------------------------------

const ID = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const takenAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const coffee = { substance: "caffeine" as const, amountMg: 95, takenAt, label: "Kohv" };
const storedRow = { id: ID, substance: "caffeine", amount_mg: 95, taken_at: takenAt, label: "Kohv" };

function call(query: Call[], method: string): Call | undefined {
  return query.find((c) => c.method === method);
}

beforeEach(() => {
  db.results = [];
  db.queries = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// --- Tests -------------------------------------------------------------------

describe("addIntake", () => {
  it("inserts only the app's columns and returns the stored intake", async () => {
    db.results.push({ data: storedRow, error: null });

    const result = await actions.addIntake(coffee);

    expect(result).toEqual({ ok: true, intake: { ...coffee, id: ID } });
    const [q] = db.queries;
    expect(call(q, "from")?.args).toEqual(["intakes"]);
    expect(call(q, "insert")?.args).toEqual([{ substance: "caffeine", amount_mg: 95, taken_at: takenAt, label: "Kohv" }]);
    expect(call(q, "single")).toBeDefined();
  });

  it("never sends a user id, even if the browser adds one", async () => {
    db.results.push({ data: storedRow, error: null });

    await actions.addIntake({ ...coffee, user_id: "someone-else" } as typeof coffee);

    expect(call(db.queries[0], "insert")?.args[0]).not.toHaveProperty("user_id");
  });

  it("rejects invalid input without touching the database", async () => {
    const result = await actions.addIntake({ ...coffee, amountMg: -1 });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors).toEqual({ amountMg: "Kogus peab olema suurem kui 0." });
    expect(db.queries).toHaveLength(0);
  });

  it("asks to sign in when row level security refuses", async () => {
    db.results.push({ data: null, error: { code: "42501", message: "new row violates row-level security policy" } });

    const result = await actions.addIntake(coffee);

    expect(result).toEqual({ ok: false, message: "Logi sisse, et tarbimisi salvestada ja näha." });
  });
});

describe("deleteIntake", () => {
  it("deletes by id and confirms the row was removed", async () => {
    db.results.push({ data: [{ id: ID }], error: null });

    expect(await actions.deleteIntake(ID)).toEqual({ ok: true });
    const [q] = db.queries;
    expect(call(q, "delete")).toBeDefined();
    expect(call(q, "eq")?.args).toEqual(["id", ID]);
  });

  it("reports a row that is gone or belongs to someone else", async () => {
    db.results.push({ data: [], error: null });

    const result = await actions.deleteIntake(ID);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.message).toMatch(/ei leitud/);
  });

  it("rejects an id that is not a UUID without touching the database", async () => {
    expect((await actions.deleteIntake("1 or 1=1")).ok).toBe(false);
    expect(db.queries).toHaveLength(0);
  });

  it("does not leak the database error", async () => {
    db.results.push({ data: null, error: { code: "XX000", message: "internal error at row 7" } });

    const result = await actions.deleteIntake(ID);

    expect(result).toEqual({ ok: false, message: "Salvestamine ebaõnnestus. Proovi uuesti." });
  });
});

describe("listIntakes", () => {
  const from = "2026-11-24T22:00:00.000Z";
  const to = "2026-11-25T15:00:00.000Z";

  it("queries the range newest first and converts the rows", async () => {
    db.results.push({ data: [storedRow], error: null });

    const result = await actions.listIntakes(from, to);

    expect(result).toEqual({ ok: true, intakes: [{ ...coffee, id: ID }] });
    const [q] = db.queries;
    expect(call(q, "gte")?.args).toEqual(["taken_at", from]);
    expect(call(q, "lte")?.args).toEqual(["taken_at", to]);
    expect(call(q, "order")?.args).toEqual(["taken_at", { ascending: false }]);
  });

  it("accepts a range given in the user's own time zone", async () => {
    await actions.listIntakes("2026-11-25T00:00:00+02:00", to);

    expect(call(db.queries[0], "gte")?.args).toEqual(["taken_at", "2026-11-24T22:00:00.000Z"]);
  });

  it("skips rows the app cannot show", async () => {
    db.results.push({ data: [storedRow, { ...storedRow, id: "x", substance: "alcohol" }], error: null });

    const result = await actions.listIntakes(from, to);

    expect(result.ok && result.intakes.map((intake) => intake.id)).toEqual([ID]);
  });

  it("returns an empty list when there is nothing", async () => {
    db.results.push({ data: [], error: null });

    expect(await actions.listIntakes(from, to)).toEqual({ ok: true, intakes: [] });
  });

  it("rejects a bad or too long range without touching the database", async () => {
    expect((await actions.listIntakes(to, from)).ok).toBe(false);
    expect((await actions.listIntakes("2026-01-01T00:00:00.000Z", to)).ok).toBe(false);
    expect((await actions.listIntakes("2026-11-25T00:00", to)).ok).toBe(false);
    expect(db.queries).toHaveLength(0);
  });

  it("asks to sign in when the user has no session", async () => {
    db.results.push({ data: null, error: { code: "42501", message: "permission denied for table intakes" } });

    const result = await actions.listIntakes(from, to);

    expect(result).toEqual({ ok: false, message: "Logi sisse, et tarbimisi salvestada ja näha." });
  });
});
