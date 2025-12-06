// Mock de dados de cobrança
// Remover este arquivo ao integrar com backend real

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  description: string;
}

export interface PaymentMethod {
  id: string;
  type: "credit_card" | "pix";
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export const currentSubscription = {
  plan: "Pro",
  price: 149.90,
  billingCycle: "monthly" as const,
  nextBillingDate: "2025-01-15",
  status: "active" as const,
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "credit_card",
    last4: "4242",
    brand: "Visa",
    isDefault: true,
  },
  {
    id: "pm_2",
    type: "credit_card",
    last4: "5555",
    brand: "Mastercard",
    isDefault: false,
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv_001",
    date: "2024-12-15",
    amount: 149.90,
    status: "paid",
    description: "Plano Pro - Dezembro 2024",
  },
  {
    id: "inv_002",
    date: "2024-11-15",
    amount: 149.90,
    status: "paid",
    description: "Plano Pro - Novembro 2024",
  },
  {
    id: "inv_003",
    date: "2024-10-15",
    amount: 149.90,
    status: "paid",
    description: "Plano Pro - Outubro 2024",
  },
  {
    id: "inv_004",
    date: "2024-09-15",
    amount: 99.90,
    status: "paid",
    description: "Plano Starter - Setembro 2024",
  },
];

export const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 99.90,
    features: [
      "200 consultas/dia",
      "Batch até 100 GTINs",
      "10 req/min",
      "Suporte por email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149.90,
    features: [
      "1000 consultas/dia",
      "Batch até 100 GTINs",
      "30 req/min",
      "Suporte prioritário",
    ],
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    features: [
      "Consultas ilimitadas",
      "Bulk assíncrono",
      "IP allowlist",
      "SLA garantido",
      "Gerente dedicado",
    ],
  },
];


