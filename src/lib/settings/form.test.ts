import { describe, expect, it } from "vitest";
import { parseSettingsForm, settingsToForm } from "@/lib/settings/form";

describe("parseSettingsForm", () => {
  it("turns empty fields into no limit", () => {
    expect(parseSettingsForm({ caffeineLimitMg: "", nicotineLimitMg: " " })).toEqual({
      ok: true,
      settings: { caffeineLimitMg: null, nicotineLimitMg: null },
    });
  });

  it("reads whole milligrams", () => {
    expect(parseSettingsForm({ caffeineLimitMg: "400", nicotineLimitMg: "20" })).toEqual({
      ok: true,
      settings: { caffeineLimitMg: 400, nicotineLimitMg: 20 },
    });
  });

  it("uses each substance's own range", () => {
    expect(parseSettingsForm({ caffeineLimitMg: "2001", nicotineLimitMg: "201" })).toEqual({
      ok: false,
      errors: { caffeineLimitMg: "Limiit peab olema 1–2000 mg.", nicotineLimitMg: "Limiit peab olema 1–200 mg." },
    });
    expect(parseSettingsForm({ caffeineLimitMg: "0", nicotineLimitMg: "" })).toMatchObject({ ok: false });
  });

  it("rejects text and decimals", () => {
    const result = parseSettingsForm({ caffeineLimitMg: "palju", nicotineLimitMg: "1,5" });
    expect(result).toEqual({
      ok: false,
      errors: {
        caffeineLimitMg: "Sisesta täisarv milligrammides või jäta tühjaks.",
        nicotineLimitMg: "Sisesta täisarv milligrammides või jäta tühjaks.",
      },
    });
  });
});

describe("settingsToForm", () => {
  it("shows no limit as an empty field", () => {
    expect(settingsToForm({ caffeineLimitMg: 400, nicotineLimitMg: null })).toEqual({
      caffeineLimitMg: "400",
      nicotineLimitMg: "",
    });
  });
});
