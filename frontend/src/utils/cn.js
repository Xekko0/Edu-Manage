/** Gộp class Tailwind — bỏ falsy. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
