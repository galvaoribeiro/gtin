"use client";

import { useEffect, useState } from "react";
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
import { getCurrentUser, updateCurrentUser, UserData } from "@/lib/api";

type ProfileForm = {
  organization_name: string;
  email: string;
  plan: string | null;
  daily_limit: number | null;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data: UserData = await getCurrentUser();
        setProfile({
          organization_name: data.organization_name || "",
          email: data.email,
          plan: data.plan,
          daily_limit: data.daily_limit,
        });
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar suas informações. Faça login novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateCurrentUser({
        email: profile.email,
        organization_name: profile.organization_name,
      });
      setProfile({
        organization_name: updated.organization_name || "",
        email: updated.email,
        plan: updated.plan,
        daily_limit: updated.daily_limit,
      });
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Gerencie os dados da sua conta e organização
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-zinc-500">Carregando...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da organização</label>
                  <Input
                    value={profile?.organization_name ?? ""}
                    onChange={(e) => handleProfileChange("organization_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={profile?.email ?? ""}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>Plano:</span>
                  <Badge variant="outline">{profile?.plan || "basic"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Limite diário:</span>
                  <Badge variant="outline">
                    {profile?.daily_limit ?? 0} consultas/dia
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isLoading}>
                  {isSaving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
