const WORDS = ['Add more', 'Weak', 'Getting there', 'Strong', 'Forged'];

// 0-4: length, a capital, a number, a symbol. Weak passwords are not scolded; the bar just stays short.
export function passwordStrength(value) {
  if (!value) return { score: 0, word: WORDS[0] };
  const score = Math.min(4, (value.length >= 8 ? 1 : 0) + (/[A-Z]/.test(value) ? 1 : 0)
    + (/[0-9]/.test(value) ? 1 : 0) + (/[^A-Za-z0-9]/.test(value) ? 1 : 0));
  return { score, word: WORDS[score] };
}

export const isEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value).trim());
