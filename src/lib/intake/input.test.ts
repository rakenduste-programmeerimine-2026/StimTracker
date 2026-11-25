import { describe, expect, it } from "vitest";
import { MAX_RANGE_DAYS, parseIntakeId, parseIsoTime, parseNewIntake, parseTimeRange } from "@/lib/intake/input";

const now = new Date("2026-11-25T15:00:00.000Z");
const coffee = { substance: "caffeine", amountMg: 95, takenAt: "2026-11-25T14:30:00.000Z", label: "Kohv" };

describe("parseIsoTime", () => {
  it("accepts ISO times with a zone", () => {
    expect(parseIsoTime("2026-11-25T14:05:00.000Z")?.toISOString()).toBe("2026-11-25T14:05:00.000Z");
    expect(parseIsoTime("2026-11-25T16:05:00+02:00")?.toISOString()).toBe("2026-11-25T14:05:00.000Z");
    expect(parseIsoTime("2026-11-25T14:05Z")?.toISOString()).toBe("2026-11-25T14:05:00.000Z");
  });

  it("rejects times without a zone, other formats and non-strings", () => {
    expect(parseIsoTime("2026-11-25T14:05")).toBeNull();
    expect(parseIsoTime("2026-11-25")).toBeNull();
    expect(parseIsoTime("25.11.2026 14:05")).toBeNull();
    expect(parseIsoTime("2026-13-45T99:99:00Z")).toBeNull();
    expect(parseIsoTime(1764079500000)).toBeNull();
    expect(parseIsoTime(undefined)).toBeNull();
  });
});

describe("parseNewIntake", () => {
  it("accepts what the presets and the form send", () => {
    expect(parseNewIntake(coffee, now)).toEqual({
      ok: true,
      value: { substance: "caffeine", amountMg: 95, takenAt: new Date(coffee.takenAt), label: "Kohv" },
    });
  });

  it("fills in the default label when it is empty or missing", () => {
    const result = parseNewIntake({ ...coffee, label: undefined }, now);
    expect(result.ok && result.value.label).toBe("Kofeiin");
  });

  it("uses the form's rules and messages", () => {
    expect(parseNewIntake({ ...coffee, amountMg: 0 }, now)).toEqual({
      ok: false,
      errors: { amountMg: "Kogus peab olema suurem kui 0." },
    });
    expect(parseNewIntake({ ...coffee, amountMg: -5 }, now)).toEqual({
      ok: false,
      errors: { amountMg: "Kogus peab olema suurem kui 0." },
    });
    expect(parseNewIntake({ ...coffee, amountMg: 5000 }, now)).toEqual({
      ok: false,
      errors: { amountMg: "Kogus on liiga suur, maksimaalselt 1000 mg korraga." },
    });
    expect(parseNewIntake({ ...coffee, substance: "alcohol" }, now).ok).toBe(false);
    expect(parseNewIntake({ ...coffee, takenAt: "2026-11-25T16:00:00.000Z" }, now)).toEqual({
      ok: false,
      errors: { takenAt: "Aeg ei saa olla tulevikus." },
    });
  });

  it("rejects wrong types instead of guessing", () => {
    expect(parseNewIntake({ ...coffee, amountMg: "95" }, now).ok).toBe(false);
    expect(parseNewIntake({ ...coffee, amountMg: Number.POSITIVE_INFINITY }, now).ok).toBe(false);
    expect(parseNewIntake({ ...coffee, takenAt: "2026-11-25T14:30" }, now).ok).toBe(false);
    expect(parseNewIntake({ ...coffee, label: 42 }, now).ok).toBe(false);
    expect(parseNewIntake(null, now)).toEqual({ ok: false, errors: {} });
    expect(parseNewIntake("coffee", now)).toEqual({ ok: false, errors: {} });
  });
});

describe("parseTimeRange", () => {
  it("accepts a day", () => {
    expect(parseTimeRange("2026-11-24T22:00:00.000Z", "2026-11-25T15:00:00.000Z")).toEqual({
      from: new Date("2026-11-24T22:00:00.000Z"),
      to: new Date("2026-11-25T15:00:00.000Z"),
    });
  });

  it("rejects a range that ends before it starts", () => {
    expect(parseTimeRange("2026-11-25T15:00:00.000Z", "2026-11-24T22:00:00.000Z")).toBeNull();
  });

  it("limits how long a range can be", () => {
    const from = new Date("2026-10-01T00:00:00.000Z");
    const to = (days: number) => new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    expect(parseTimeRange(from.toISOString(), to(MAX_RANGE_DAYS))).not.toBeNull();
    expect(parseTimeRange(from.toISOString(), to(MAX_RANGE_DAYS + 1))).toBeNull();
  });

  it("rejects times that are not ISO with a zone", () => {
    expect(parseTimeRange("2026-11-25T00:00", "2026-11-25T15:00:00.000Z")).toBeNull();
    expect(parseTimeRange(undefined, "2026-11-25T15:00:00.000Z")).toBeNull();
  });
});

describe("parseIntakeId", () => {
  it("accepts a UUID", () => {
    expect(parseIntakeId("0A1B2C3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D")).toBe("0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d");
  });

  it("rejects anything else", () => {
    expect(parseIntakeId("1")).toBeNull();
    expect(parseIntakeId("0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d; drop table")).toBeNull();
    expect(parseIntakeId(null)).toBeNull();
  });
});
