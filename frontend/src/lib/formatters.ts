const monthLabels = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function toDateParts(value: string) {
  const date = new Date(value);

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: monthLabels[date.getMonth()] ?? "",
    year: String(date.getFullYear()),
    hours: String(date.getHours()).padStart(2, "0"),
    minutes: String(date.getMinutes()).padStart(2, "0"),
  };
}

export function formatShortDate(value: string) {
  const { day, month, year } = toDateParts(value);

  return `${day} ${month} ${year}`;
}

export function formatDateTime(value: string) {
  const { hours, minutes } = toDateParts(value);

  return `${formatShortDate(value)}, ${hours}:${minutes}`;
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length !== 11) {
    return value;
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
