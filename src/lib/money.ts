export function formatMinor(minor: number | null | undefined, currency = "INR"): string {
  if (minor == null) return "missing";
  const value = minor / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(value);
}

export function multiplyMinor(quantity: number | null | undefined, rateMinor: number | null | undefined): number | null {
  if (quantity == null || rateMinor == null) return null;
  // exact-ish integer: quantity may be fractional. Use cents rounding to nearest paisa.
  return Math.round(quantity * rateMinor);
}

export function sumMinor(values: (number | null)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}
