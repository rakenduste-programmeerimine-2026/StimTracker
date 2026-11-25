import { describe, expect, it } from "vitest";
import { parseAmount, toDateTimeLocal, validateIntake, type IntakeFormValues } from "@/lib/intake/validation";

const now = new Date(2026, 10, 25, 15, 0);
const valid: IntakeFormValues = {
  substance: "caffeine",
  amountMg: "95",
  takenAt: "2026-11-25T14:30",
  label: "Kohv",
};

describe("parseAmount", () => {
  it("accepts a dot or a comma as the decimal mark", () => {
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount(" 1,5 ")).toBe(1.5);
    expect(parseAmount("95")).toBe(95);
  });

  it("rejects text, signs and empty input", () => {
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("-5")).toBeNaN();
    expect(parseAmount("1e3")).toBeNaN();
    expect(parseAmount("")).toBeNaN();
  });
});

describe("validateIntake", () => {
  it("returns parsed values for valid input", () => {
    const result = validateIntake(valid, now);
    expect(result).toEqual({
      ok: true,
      value: { substance: "caffeine", amountMg: 95, takenAt: new Date(2026, 10, 25, 14, 30), label: "Kohv" },
    });
  });

  it("uses a default label when none is given", () => {
    const result = validateIntake({ ...valid, substance: "nicotine", amountMg: "3", label: "  " }, now);
    expect(result.ok && result.value.label).toBe("Nikotiin");
  });

  it("requires a known substance", () => {
    const result = validateIntake({ ...valid, substance: "" }, now);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.substance).toMatch(/kofeiin või nikotiin/);
  });

  it.each([
    ["", "Sisesta kogus milligrammides."],
    ["kaks", "Kogus peab olema number, näiteks 95 või 1,5."],
    ["0", "Kogus peab olema suurem kui 0."],
    ["1001", "Kogus on liiga suur, maksimaalselt 1000 mg korraga."],
  ])("rejects amount %j", (amountMg, message) => {
    const result = validateIntake({ ...valid, amountMg }, now);
    expect(!result.ok && result.errors.amountMg).toBe(message);
  });

  it("uses the nicotine limit for nicotine", () => {
    const result = validateIntake({ ...valid, substance: "nicotine", amountMg: "150" }, now);
    expect(!result.ok && result.errors.amountMg).toBe("Kogus on liiga suur, maksimaalselt 100 mg korraga.");
  });

  it("rejects a missing or future time", () => {
    const empty = validateIntake({ ...valid, takenAt: "" }, now);
    expect(!empty.ok && empty.errors.takenAt).toBe("Sisesta kellaaeg.");
    const future = validateIntake({ ...valid, takenAt: "2026-11-25T15:10" }, now);
    expect(!future.ok && future.errors.takenAt).toBe("Aeg ei saa olla tulevikus.");
  });

  it("allows a time up to one minute ahead", () => {
    expect(validateIntake({ ...valid, takenAt: "2026-11-25T15:01" }, now).ok).toBe(true);
  });

  it("reports every invalid field at once", () => {
    const result = validateIntake({ substance: "", amountMg: "", takenAt: "", label: "x".repeat(61) }, now);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["amountMg", "label", "substance", "takenAt"]);
  });
});

describe("toDateTimeLocal", () => {
  it("formats in local time with leading zeros", () => {
    expect(toDateTimeLocal(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
  });
});
