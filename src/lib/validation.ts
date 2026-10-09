/** Form validation shared by the auth screens. Pure functions, no React. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD = 8;

/** Substrings that make a "strong" password trivially guessable. */
const WEAK_FRAGMENTS = ['password', 'qwerty', '123456', 'letmein', 'iloveyou', 'admin', 'pehawar'];

export function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Tell us what to call you.';
  if (trimmed.length < 2) return 'That looks too short.';
  if (!/[\p{L}]/u.test(trimmed)) return 'Names need at least one letter.';
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'We need an email to reach you.';
  if (!EMAIL_RE.test(trimmed)) return 'That email does not look right.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return 'Choose a password.';
  if (value.length < MIN_PASSWORD) return `At least ${MIN_PASSWORD} characters.`;
  // if (WEAK_FRAGMENTS.some((fragment) => value.toLowerCase().includes(fragment)))
  //   return 'That is one of the first things anyone would guess.';
  return null;
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type PasswordScore = {
  /** 0–4. */
  score: number;
  label: string;
  /** Actionable notes, not generic encouragement. */
  hints: string[];
};

const LABELS = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];

export function scorePassword(value: string): PasswordScore {
  const hints: string[] = [];
  let score = 0;

  if (value.length >= MIN_PASSWORD) score += 1;
  else hints.push(`Use at least ${MIN_PASSWORD} characters`);

  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  else hints.push('Mix upper and lower case');

  if (/\d/.test(value)) score += 1;
  else hints.push('Add a number');

  if (/[^\w\s]/.test(value)) score += 1;
  else hints.push('Add a symbol');

  if (value.length >= 14) score = Math.min(4, score + 1);
  if (WEAK_FRAGMENTS.some((fragment) => value.toLowerCase().includes(fragment))) score = 0;

  return { score, label: LABELS[score], hints: hints.slice(0, 2) };
}
