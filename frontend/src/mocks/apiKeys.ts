// Mock de API Keys
// Remover este arquivo ao integrar com backend real

export interface ApiKey {
  id: string;
  key: string;
  maskedKey: string;
  name: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsed: string | null;
}

export const initialApiKeys: ApiKey[] = [
  {
    id: "key_1",
    key: "sk_live_abc123def456ghi789jkl012mno345",
    maskedKey: "sk_live_abc1...o345",
    name: "Produção",
    status: "active",
    createdAt: "2024-10-15T10:30:00Z",
    lastUsed: "2025-01-10T14:22:00Z",
  },
  {
    id: "key_2",
    key: "sk_live_xyz789abc123def456ghi789jkl012",
    maskedKey: "sk_live_xyz7...l012",
    name: "Desenvolvimento",
    status: "active",
    createdAt: "2024-11-20T08:15:00Z",
    lastUsed: "2025-01-09T09:45:00Z",
  },
  {
    id: "key_3",
    key: "sk_live_old456xyz789abc123def456ghi789",
    maskedKey: "sk_live_old4...i789",
    name: "Chave antiga",
    status: "revoked",
    createdAt: "2024-06-01T12:00:00Z",
    lastUsed: "2024-09-15T16:30:00Z",
  },
];

// Função para gerar nova chave mock
export function generateMockKey(): ApiKey {
  const randomId = Math.random().toString(36).substring(2, 8);
  const randomKey = `sk_live_${Math.random().toString(36).substring(2, 34)}`;
  
  return {
    id: `key_${randomId}`,
    key: randomKey,
    maskedKey: `sk_live_${randomKey.substring(8, 12)}...${randomKey.substring(randomKey.length - 4)}`,
    name: "Nova chave",
    status: "active",
    createdAt: new Date().toISOString(),
    lastUsed: null,
  };
}

