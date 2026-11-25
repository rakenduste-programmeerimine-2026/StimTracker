"use client";

import { useId, useState } from "react";
import { SUBSTANCES } from "@/lib/intake/substances";
import { SUBSTANCE_LABEL } from "@/lib/intake/labels";
import {
  toDateTimeLocal,
  validateIntake,
  type FieldErrors,
  type IntakeFormValues,
  type ValidIntake,
} from "@/lib/intake/validation";
import styles from "./IntakeForm.module.css";

type Props = {
  onSubmit: (intake: ValidIntake) => void;
  // Injected in tests so "now" is fixed.
  now?: () => Date;
};

function emptyValues(now: Date): IntakeFormValues {
  return { substance: "caffeine", amountMg: "", takenAt: toDateTimeLocal(now), label: "" };
}

export default function IntakeForm({ onSubmit, now = () => new Date() }: Props) {
  const id = useId();
  const [values, setValues] = useState<IntakeFormValues>(() => emptyValues(now()));
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(field: keyof IntakeFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear the error of a field as soon as the user changes it.
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateIntake(values, now());
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.value);
    setValues({ ...emptyValues(now()), substance: values.substance });
    setErrors({});
  }

  const errorId = (field: keyof IntakeFormValues) => `${id}-${field}-error`;
  const fieldProps = (field: keyof IntakeFormValues) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? errorId(field) : undefined,
  });
  const errorText = (field: keyof IntakeFormValues) =>
    errors[field] ? (
      <p id={errorId(field)} className={styles.error}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Lisa käsitsi">
      <fieldset className={styles.fieldset} {...fieldProps("substance")}>
        <legend className={styles.legend}>Aine</legend>
        <div className={styles.choices}>
          {SUBSTANCES.map((substance) => (
            <label key={substance} className={styles.choice}>
              <input
                type="radio"
                name="substance"
                value={substance}
                checked={values.substance === substance}
                onChange={(e) => update("substance", e.target.value)}
              />
              {SUBSTANCE_LABEL[substance]}
            </label>
          ))}
        </div>
        {errorText("substance")}
      </fieldset>

      <div>
        <label className={styles.label} htmlFor={`${id}-amount`}>
          Kogus (mg)
        </label>
        <input
          id={`${id}-amount`}
          className={styles.input}
          inputMode="decimal"
          autoComplete="off"
          placeholder="nt 95"
          value={values.amountMg}
          onChange={(e) => update("amountMg", e.target.value)}
          {...fieldProps("amountMg")}
        />
        {errorText("amountMg")}
      </div>

      <div>
        <label className={styles.label} htmlFor={`${id}-time`}>
          Aeg
        </label>
        <input
          id={`${id}-time`}
          className={styles.input}
          type="datetime-local"
          value={values.takenAt}
          onChange={(e) => update("takenAt", e.target.value)}
          {...fieldProps("takenAt")}
        />
        {errorText("takenAt")}
      </div>

      <div>
        <label className={styles.label} htmlFor={`${id}-label`}>
          Nimetus (valikuline)
        </label>
        <input
          id={`${id}-label`}
          className={styles.input}
          autoComplete="off"
          placeholder="nt Monster, Velo"
          value={values.label}
          onChange={(e) => update("label", e.target.value)}
          {...fieldProps("label")}
        />
        {errorText("label")}
      </div>

      <button type="submit" className={styles.submit}>
        Lisa
      </button>
    </form>
  );
}
