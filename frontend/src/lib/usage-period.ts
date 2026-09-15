export type PeriodPreset = "1d" | "7d" | "30d" | "mtd" | "last_month" | "custom";

export interface UsagePeriod {
  preset: PeriodPreset;
  start: string;
  end: string;
}

export const PERIOD_PRESETS: { id: Exclude<PeriodPreset, "custom">; label: string }[] = [
  { id: "1d", label: "1d" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "mtd", label: "MTD" },
  { id: "last_month", label: "Mês anterior" },
];

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodaySaoPaulo(): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parseISODate(iso);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getPeriodForPreset(
  preset: Exclude<PeriodPreset, "custom">,
  today = getTodaySaoPaulo()
): UsagePeriod {
  if (preset === "1d") {
    const iso = formatISODate(today);
    return { preset, start: iso, end: iso };
  }

  if (preset === "7d") {
    return {
      preset,
      start: formatISODate(addDays(today, -6)),
      end: formatISODate(today),
    };
  }

  if (preset === "30d") {
    return {
      preset,
      start: formatISODate(addDays(today, -29)),
      end: formatISODate(today),
    };
  }

  if (preset === "mtd") {
    return {
      preset,
      start: formatISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: formatISODate(today),
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 0);
  return {
    preset,
    start: formatISODate(start),
    end: formatISODate(end),
  };
}

export function formatRangeLabel(start: string, end: string): string {
  const from = parseISODate(start);
  const to = parseISODate(end);
  const sameDay = start === end;
  const includeYear =
    from.getFullYear() !== to.getFullYear() ||
    from.getFullYear() !== getTodaySaoPaulo().getFullYear();

  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  };

  const fromLabel = from.toLocaleDateString("pt-BR", opts);
  if (sameDay) return fromLabel;
  const toLabel = to.toLocaleDateString("pt-BR", opts);
  return `${fromLabel} – ${toLabel}`;
}

export function formatChartTick(iso: string, totalDays: number): string {
  const date = parseISODate(iso);
  if (totalDays <= 14) {
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatFullDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatCount(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return formatCount(value);
}

export const MAX_PERIOD_DAYS = 366;
