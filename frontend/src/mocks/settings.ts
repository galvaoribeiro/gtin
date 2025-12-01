// Mock de dados de configurações
// Remover este arquivo ao integrar com backend real

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  createdAt: string;
}

export interface NotificationSettings {
  emailAlerts: boolean;
  usageWarnings: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
}

export const userProfile: UserProfile = {
  id: "user_123",
  name: "João Silva",
  email: "joao@empresa.com.br",
  company: "Empresa Exemplo LTDA",
  phone: "(11) 99999-9999",
  createdAt: "2024-08-15T10:30:00Z",
};

export const notificationSettings: NotificationSettings = {
  emailAlerts: true,
  usageWarnings: true,
  weeklyReport: false,
  marketingEmails: false,
};

export const securitySettings = {
  twoFactorEnabled: false,
  lastPasswordChange: "2024-10-20T14:00:00Z",
  activeSessions: 2,
};

