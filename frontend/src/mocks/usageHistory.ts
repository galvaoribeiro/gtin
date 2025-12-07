// Mock de histórico de uso detalhado
// Remover este arquivo ao integrar com backend real

export interface DailyUsage {
  date: string;
  consultas: number;
  limite: number;
}

export interface UsageByEndpoint {
  endpoint: string;
  count: number;
  percentage: number;
}

export const usageHistory: DailyUsage[] = [
  { date: "2024-12-01", consultas: 347, limite: 1000 },
  { date: "2024-11-30", consultas: 124, limite: 1000 },
  { date: "2024-11-29", consultas: 389, limite: 1000 },
  { date: "2024-11-28", consultas: 456, limite: 1000 },
  { date: "2024-11-27", consultas: 198, limite: 1000 },
  { date: "2024-11-26", consultas: 312, limite: 1000 },
  { date: "2024-11-25", consultas: 245, limite: 1000 },
  { date: "2024-11-24", consultas: 89, limite: 1000 },
  { date: "2024-11-23", consultas: 156, limite: 1000 },
  { date: "2024-11-22", consultas: 423, limite: 1000 },
  { date: "2024-11-21", consultas: 567, limite: 1000 },
  { date: "2024-11-20", consultas: 234, limite: 1000 },
  { date: "2024-11-19", consultas: 678, limite: 1000 },
  { date: "2024-11-18", consultas: 145, limite: 1000 },
];

export const usageByEndpoint: UsageByEndpoint[] = [
  { endpoint: "GET /gtins/{gtin}", count: 2847, percentage: 72 },
  { endpoint: "POST /gtins:batch", count: 1102, percentage: 28 },
];

export const usageSummary = {
  thisMonth: {
    total: 8234,
    average: 274,
    peak: 678,
    peakDate: "2024-11-19",
  },
  lastMonth: {
    total: 7456,
    average: 248,
    peak: 612,
    peakDate: "2024-10-25",
  },
  growth: "+10.4%",
};




