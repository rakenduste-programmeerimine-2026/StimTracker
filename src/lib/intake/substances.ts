// Substances StimTrack tracks and how fast the body clears them.
//
// Half-lives are typical values for healthy adults. Real values vary a lot
// between people (genetics, smoking, pregnancy, some medicines), so anything
// computed from them is an estimate for the user, not medical advice.
//   caffeine: usually 3–7 h, 5 h is the common middle value
//   nicotine: usually 1–2 h, 2 h is the common upper value

export const SUBSTANCES = ["caffeine", "nicotine"] as const;

export type Substance = (typeof SUBSTANCES)[number];

export const HALF_LIFE_HOURS: Record<Substance, number> = {
  caffeine: 5,
  nicotine: 2,
};

export function isSubstance(value: unknown): value is Substance {
  return typeof value === "string" && (SUBSTANCES as readonly string[]).includes(value);
}
