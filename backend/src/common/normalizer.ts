export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}