// Mock de dados de uso para o Dashboard
// Remover este arquivo ao integrar com backend real

export const currentPlan = {
  name: "Pro",
  dailyLimit: 1000,
  rateLimit: "30 req/min",
  batchSize: 100,
};

export const usageToday = {
  consultas: 347,
  limite: currentPlan.dailyLimit,
  percentual: Math.round((347 / currentPlan.dailyLimit) * 100),
};

export const usageLast7Days = [
  { dia: "Seg", consultas: 245 },
  { dia: "Ter", consultas: 312 },
  { dia: "Qua", consultas: 198 },
  { dia: "Qui", consultas: 456 },
  { dia: "Sex", consultas: 389 },
  { dia: "Sáb", consultas: 124 },
  { dia: "Dom", consultas: 347 },
];

export const accountStatus = {
  status: "active" as const,
  memberSince: "2024-08-15",
  nextBillingDate: "2025-01-15",
};

