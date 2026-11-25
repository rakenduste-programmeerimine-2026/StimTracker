import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOT_SIGNED_IN, SAVE_FAILED, intakeDbErrorMessage } from "@/lib/intake/results";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("intakeDbErrorMessage", () => {
  it("asks to sign in when RLS refuses", () => {
    expect(intakeDbErrorMessage({ code: "42501", message: "permission denied" }, "insert")).toBe(NOT_SIGNED_IN);
  });

  it("explains a broken field for check and not-null errors", () => {
    expect(intakeDbErrorMessage({ code: "23514", message: "violates check" }, "insert")).toMatch(/vigane/);
    expect(intakeDbErrorMessage({ code: "23502", message: "null value" }, "insert")).toMatch(/vigane/);
  });

  it("never shows the raw message for other errors", () => {
    expect(intakeDbErrorMessage({ code: "XX000", message: "internal error at row 7" }, "insert")).toBe(SAVE_FAILED);
    expect(intakeDbErrorMessage({ message: "fetch failed" }, "insert")).toBe(SAVE_FAILED);
  });

  it("logs the raw error on the server", () => {
    intakeDbErrorMessage({ code: "XX000", message: "internal error" }, "delete");
    expect(console.error).toHaveBeenCalledWith("[intake] delete failed", "XX000", "internal error");
  });
});
