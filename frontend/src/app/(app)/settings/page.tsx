"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Importação dos dados mockados
import {
  userProfile,
  notificationSettings as initialNotifications,
  securitySettings,
} from "@/mocks/settings";

export default function SettingsPage() {
  const [profile, setProfile] = useState(userProfile);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (field: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simula delay de salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gerencie seu perfil e preferências
        </p>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Informações da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={profile.name}
                onChange={(e) => handleProfileChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Input
                value={profile.company}
                onChange={(e) => handleProfileChange("company", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={profile.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Configure quais notificações deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas por Email</p>
                <p className="text-sm text-zinc-500">
                  Receba alertas de erros e problemas críticos
                </p>
              </div>
              <Button
                variant={notifications.emailAlerts ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle("emailAlerts")}
              >
                {notifications.emailAlerts ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Avisos de Uso</p>
                <p className="text-sm text-zinc-500">
                  Notificação quando atingir 80% do limite diário
                </p>
              </div>
              <Button
                variant={notifications.usageWarnings ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle("usageWarnings")}
              >
                {notifications.usageWarnings ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Relatório Semanal</p>
                <p className="text-sm text-zinc-500">
                  Resumo de uso enviado toda segunda-feira
                </p>
              </div>
              <Button
                variant={notifications.weeklyReport ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle("weeklyReport")}
              >
                {notifications.weeklyReport ? "Ativado" : "Desativado"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Emails de Marketing</p>
                <p className="text-sm text-zinc-500">
                  Novidades, dicas e ofertas especiais
                </p>
              </div>
              <Button
                variant={notifications.marketingEmails ? "default" : "outline"}
                size="sm"
                onClick={() => handleNotificationToggle("marketingEmails")}
              >
                {notifications.marketingEmails ? "Ativado" : "Desativado"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Configurações de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação em Duas Etapas</p>
              <p className="text-sm text-zinc-500">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={securitySettings.twoFactorEnabled ? "default" : "outline"}>
                {securitySettings.twoFactorEnabled ? "Ativado" : "Desativado"}
              </Badge>
              <Button variant="outline" size="sm">
                {securitySettings.twoFactorEnabled ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Senha</p>
              <p className="text-sm text-zinc-500">
                Última alteração:{" "}
                {new Date(securitySettings.lastPasswordChange).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Alterar Senha
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sessões Ativas</p>
              <p className="text-sm text-zinc-500">
                {securitySettings.activeSessions} dispositivos conectados
              </p>
            </div>
            <Button variant="outline" size="sm">
              Gerenciar Sessões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Exportar Dados</p>
              <p className="text-sm text-zinc-500">
                Baixe uma cópia de todos os seus dados
              </p>
            </div>
            <Button variant="outline" size="sm">
              Exportar
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">
                Excluir Conta
              </p>
              <p className="text-sm text-zinc-500">
                Essa ação é permanente e não pode ser desfeita
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
