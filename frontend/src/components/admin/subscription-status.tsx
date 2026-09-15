import { Badge } from "@/components/ui/badge";

function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
      return "Ativa";
    case "trialing":
      return "Trial";
    case "canceled":
    case "cancelled":
      return "Cancelada";
    case "past_due":
      return "Vencida";
    case "unpaid":
      return "Não paga";
    case "incomplete":
      return "Incompleta";
    default:
      return status || "—";
  }
}

export function SubscriptionStatusBadges({
  status,
  cancelAtPeriodEnd = false,
}: {
  status: string | null | undefined;
  cancelAtPeriodEnd?: boolean;
}) {
  if (!status && !cancelAtPeriodEnd) {
    return <span className="text-zinc-400">—</span>;
  }

  let statusBadge = null;
  if (status === "active" || status === "trialing") {
    statusBadge = <Badge variant="default">{statusLabel(status)}</Badge>;
  } else if (status === "canceled" || status === "cancelled") {
    statusBadge = <Badge variant="destructive">Cancelada</Badge>;
  } else if (status === "past_due" || status === "unpaid") {
    statusBadge = (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        {statusLabel(status)}
      </Badge>
    );
  } else if (status) {
    statusBadge = <Badge variant="secondary">{statusLabel(status)}</Badge>;
  }

  const showScheduled =
    cancelAtPeriodEnd && status !== "canceled" && status !== "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {statusBadge}
      {showScheduled && (
        <Badge variant="destructive">Cancelamento agendado</Badge>
      )}
    </div>
  );
}
