import { ManualOnlyAdapter } from "./adapter";

export function getAdapter() {
  // Default manual-only. Real provider adapter added only when env configured AND org consent.
  return new ManualOnlyAdapter();
}
