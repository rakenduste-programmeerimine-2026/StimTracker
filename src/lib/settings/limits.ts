// How today's intake compares with the daily limit.

export type LimitLevel = "none" | "ok" | "near" | "over";

export type LimitStatus = {
  level: LimitLevel;
  limitMg: number | null;
  // Share of the limit used today, 1 = exactly at the limit. null without a limit.
  share: number | null;
  // How much is left before the limit (0 when over).
  leftMg: number;
  // How much over the limit (0 when under).
  overMg: number;
};

// From this share of the limit on, the Today page warns.
export const NEAR_LIMIT_SHARE = 0.8;

export function limitStatus(takenMg: number, limitMg: number | null): LimitStatus {
  if (limitMg === null || limitMg <= 0) {
    return { level: "none", limitMg: null, share: null, leftMg: 0, overMg: 0 };
  }
  const share = takenMg / limitMg;
  const level: LimitLevel = takenMg > limitMg ? "over" : share >= NEAR_LIMIT_SHARE ? "near" : "ok";
  return {
    level,
    limitMg,
    share,
    leftMg: Math.max(0, limitMg - takenMg),
    overMg: Math.max(0, takenMg - limitMg),
  };
}
