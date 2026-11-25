import { describe, expect, it } from "vitest";
import { rowToIntake, rowsToIntakes, toInsertRow, type IntakeRow } from "@/lib/intake/rows";

const row: IntakeRow = {
  id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  substance: "caffeine",
  amount_mg: 95,
  taken_at: "2026-11-25T12:05:00+00:00",
  label: "Kohv",
};

describe("rowToIntake", () => {
  it("converts a database row to the app type", () => {
    expect(rowToIntake(row)).toEqual({
      id: row.id,
      substance: "caffeine",
      amountMg: 95,
      takenAt: "2026-11-25T12:05:00.000Z",
      label: "Kohv",
    });
  });

  it("reads a numeric amount that arrives as text", () => {
    expect(rowToIntake({ ...row, amount_mg: "1.5" })?.amountMg).toBe(1.5);
  });

  it("drops rows the app cannot show", () => {
    expect(rowToIntake({ ...row, substance: "alcohol" })).toBeNull();
    expect(rowToIntake({ ...row, amount_mg: "lots" })).toBeNull();
    expect(rowToIntake({ ...row, taken_at: "yesterday" })).toBeNull();
  });

  it("ignores extra columns from the generated Row type", () => {
    const fullRow = { ...row, user_id: "someone", created_at: "2026-11-25T12:05:01+00:00" };
    expect(rowToIntake(fullRow)).not.toHaveProperty("user_id");
  });
});

describe("rowsToIntakes", () => {
  it("keeps the good rows in order and skips the bad ones", () => {
    const second = { ...row, id: "1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e", substance: "nicotine", amount_mg: 3 };
    const intakes = rowsToIntakes([row, { ...row, substance: "?" }, second]);
    expect(intakes.map((intake) => intake.id)).toEqual([row.id, second.id]);
  });
});

describe("toInsertRow", () => {
  it("sends only the columns the app owns", () => {
    const insert = toInsertRow({
      substance: "nicotine",
      amountMg: 3,
      takenAt: new Date("2026-11-25T12:05:00.000Z"),
      label: "Snus",
    });
    expect(insert).toEqual({
      substance: "nicotine",
      amount_mg: 3,
      taken_at: "2026-11-25T12:05:00.000Z",
      label: "Snus",
    });
    expect(insert).not.toHaveProperty("user_id");
  });
});
