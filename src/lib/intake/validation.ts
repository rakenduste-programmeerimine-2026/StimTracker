import { isSubstance, type Substance } from "@/lib/intake/substances";

// Validation for the add-intake form. Messages are in Estonian and shown by
// the form itself (the form uses noValidate, so the browser's own English
// messages never appear).

export type IntakeFormValues = {
  substance: string;
  amountMg: string;
  // Value of <input type="datetime-local">, e.g. "2026-11-25T14:05"
  takenAt: string;
  label: string;
};

export type IntakeField = keyof IntakeFormValues;
export type FieldErrors = Partial<Record<IntakeField, string>>;

export type ValidIntake = {
  substance: Substance;
  amountMg: number;
  takenAt: Date;
  label: string;
};

export type ValidationResult = { ok: true; value: ValidIntake } | { ok: false; errors: FieldErrors };

// Upper limits that catch typos (e.g. 950 instead of 95), not health limits.
export const MAX_MG: Record<Substance, number> = {
  caffeine: 1000,
  nicotine: 100,
};

// A clock that is a bit ahead should not block logging "now".
const FUTURE_TOLERANCE_MS = 60 * 1000;
const MAX_LABEL_LENGTH = 60;

export const DEFAULT_LABEL: Record<Substance, string> = {
  caffeine: "Kofeiin",
  nicotine: "Nikotiin",
};

// Accepts both "1.5" and "1,5", since Estonian keyboards type a comma.
export function parseAmount(raw: string): number {
  const text = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text)) return Number.NaN;
  return Number(text);
}

export function validateIntake(values: IntakeFormValues, now: Date): ValidationResult {
  const errors: FieldErrors = {};

  const substance = values.substance;
  if (!isSubstance(substance)) {
    errors.substance = "Vali, kas see oli kofeiin või nikotiin.";
  }

  const amountMg = parseAmount(values.amountMg);
  if (values.amountMg.trim() === "") {
    errors.amountMg = "Sisesta kogus milligrammides.";
  } else if (Number.isNaN(amountMg)) {
    errors.amountMg = "Kogus peab olema number, näiteks 95 või 1,5.";
  } else if (amountMg <= 0) {
    errors.amountMg = "Kogus peab olema suurem kui 0.";
  } else if (isSubstance(substance) && amountMg > MAX_MG[substance]) {
    errors.amountMg = `Kogus on liiga suur, maksimaalselt ${MAX_MG[substance]} mg korraga.`;
  }

  const takenAt = new Date(values.takenAt);
  if (values.takenAt.trim() === "") {
    errors.takenAt = "Sisesta kellaaeg.";
  } else if (Number.isNaN(takenAt.getTime())) {
    errors.takenAt = "Kellaaeg ei ole õiges vormingus.";
  } else if (takenAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    errors.takenAt = "Aeg ei saa olla tulevikus.";
  }

  const label = values.label.trim();
  if (label.length > MAX_LABEL_LENGTH) {
    errors.label = `Nimetus võib olla kuni ${MAX_LABEL_LENGTH} märki.`;
  }

  if (Object.keys(errors).length > 0 || !isSubstance(substance)) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: { substance, amountMg, takenAt, label: label || DEFAULT_LABEL[substance] },
  };
}

// Date -> value for <input type="datetime-local"> in the user's own time zone.
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
