"use client";

import { useEffect, useId, useState } from "react";
import { SUBSTANCE_LABEL } from "@/lib/intake/labels";
import { SUBSTANCES } from "@/lib/intake/substances";
import { parseSettingsForm, settingsToForm, type LimitFormErrors, type LimitFormValues } from "@/lib/settings/form";
import { saveSettings, useSettings } from "@/lib/settings/store";
import { LIMIT_FIELD, LIMIT_RANGE, type SettingsField } from "@/lib/settings/types";
import styles from "./SettingsView.module.css";

// Daily limits. Empty means no limit. The Today page compares today's
// intake with these.
export default function SettingsView() {
  const id = useId();
  const { status, settings, error: loadError } = useSettings();
  const [values, setValues] = useState<LimitFormValues>(() => settingsToForm(settings));
  const [errors, setErrors] = useState<LimitFormErrors>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  // Fill the form once the saved limits arrive, unless the user already typed.
  useEffect(() => {
    if (status === "ready" && !edited) setValues(settingsToForm(settings));
  }, [status, settings, edited]);

  function update(field: SettingsField, value: string) {
    setEdited(true);
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseSettingsForm(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setSaving(true);
    const result = await saveSettings(parsed.settings);
    setSaving(false);
    if (result.ok) {
      setEdited(false);
      setMessage({ ok: true, text: "Salvestatud." });
    } else {
      setErrors(result.fieldErrors ?? {});
      setMessage({ ok: false, text: result.message });
    }
  }

  return (
    <>
      <h1 className={styles.title}>Seaded</h1>
      <p className={styles.lead}>
        Pane endale päevalimiit. Täna lehel näed, kui lähedal sa sellele oled. Tühjaks jättes limiiti pole.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Päevalimiidid">
        {/* After a save, its answer replaces the loading error, so the same
            message is never shown twice. */}
        {status === "error" && loadError && !message && (
          <p className={styles.alert} role="alert">
            {loadError}
          </p>
        )}

        {SUBSTANCES.map((substance) => {
          const field = LIMIT_FIELD[substance];
          const { min, max } = LIMIT_RANGE[substance];
          const inputId = `${id}-${field}`;
          const errorId = `${inputId}-error`;
          return (
            <div key={substance} className={`${styles.field} ${styles[substance] ?? ""}`}>
              <label className={styles.label} htmlFor={inputId}>
                {SUBSTANCE_LABEL[substance]} päevas
              </label>
              <div className={styles.inputRow}>
                <input
                  id={inputId}
                  className={styles.input}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="limiiti pole"
                  value={values[field]}
                  onChange={(e) => update(field, e.target.value)}
                  aria-invalid={errors[field] ? true : undefined}
                  aria-describedby={errors[field] ? errorId : undefined}
                />
                <span className={styles.unit}>mg</span>
              </div>
              {errors[field] ? (
                <p id={errorId} className={styles.error}>
                  {errors[field]}
                </p>
              ) : (
                <p className={styles.hint}>
                  {min}–{max} mg
                </p>
              )}
            </div>
          );
        })}

        {message && (
          <p className={message.ok ? styles.saved : styles.alert} role={message.ok ? "status" : "alert"}>
            {message.text}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={saving || status === "loading"}>
          {saving ? "Salvestan…" : "Salvesta"}
        </button>
      </form>
    </>
  );
}
