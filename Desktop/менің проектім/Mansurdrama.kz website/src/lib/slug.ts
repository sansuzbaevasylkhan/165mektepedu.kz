/**
 * Convert a drama title to a URL-safe slug
 * Examples:
 *   "The Glory" -> "the-glory"
 *   "Squid Game 3" -> "squid-game-3"
 *   "Абай жолы" -> "abay-zholy"
 */
export function slugify(text: string): string {
  const cyrillicMap: Record<string, string> = {
    а: "a",
    ә: "a",
    б: "b",
    в: "v",
    г: "g",
    ғ: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    қ: "k",
    л: "l",
    м: "m",
    н: "n",
    ң: "n",
    о: "o",
    ө: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ұ: "u",
    ү: "u",
    ф: "f",
    х: "kh",
    һ: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ъ: "",
    ы: "y",
    і: "i",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return text
    .toString()
    .toLowerCase()
    .split("")
    .map((char) => cyrillicMap[char] ?? char)
    .join("")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug by appending a number if necessary
 */
export function generateUniqueSlug(base: string, existing: string[]): string {
  let slug = slugify(base);
  if (!slug) slug = "drama";

  if (!existing.includes(slug)) return slug;

  let counter = 2;
  while (existing.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
