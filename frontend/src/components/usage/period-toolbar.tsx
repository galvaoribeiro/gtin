"use client";

import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PERIOD_PRESETS,
  addDays,
  formatISODate,
  formatRangeLabel,
  getPeriodForPreset,
  getTodaySaoPaulo,
  parseISODate,
  type UsagePeriod,
} from "@/lib/usage-period";

interface PeriodToolbarProps {
  period: UsagePeriod;
  onChange: (period: UsagePeriod) => void;
  disabled?: boolean;
}

export function PeriodToolbar({ period, onChange, disabled }: PeriodToolbarProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const today = useMemo(() => getTodaySaoPaulo(), []);
  const minDate = useMemo(() => addDays(today, -365), [today]);

  const currentRange: DateRange = {
    from: parseISODate(period.start),
    to: parseISODate(period.end),
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <Popover
        open={open}
        modal
        onOpenChange={(next) => {
          setOpen(next);
          setDraftRange(next ? currentRange : undefined);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="h-8 w-fit gap-2 rounded-lg px-3 text-sm font-normal"
            aria-label="Selecionar período"
          >
            <CalendarIcon className="size-3.5 text-zinc-500" />
            {formatRangeLabel(period.start, period.end)}
            <ChevronDown className="size-3.5 text-zinc-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
          side="bottom"
          sideOffset={8}
        >
          <Calendar
            mode="range"
            locale={ptBR}
            numberOfMonths={1}
            defaultMonth={currentRange.from}
            selected={draftRange}
            disabled={[{ after: today }, { before: minDate }]}
            formatters={{
              formatWeekdayName: (date) =>
                date.toLocaleDateString("pt-BR", { weekday: "narrow" }),
            }}
            onSelect={(range) => {
              const from = range?.from;
              const to = range?.to;
              const previousComplete = Boolean(draftRange?.from && draftRange?.to);

              if (previousComplete) {
                const clicked =
                  to && from && to.getTime() !== draftRange?.to?.getTime()
                    ? to
                    : from;
                setDraftRange(clicked ? { from: clicked, to: undefined } : undefined);
                return;
              }

              setDraftRange(range);
              if (!from || !to) return;

              onChange({
                preset: "custom",
                start: formatISODate(from),
                end: formatISODate(to),
              });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap items-center gap-1">
        {PERIOD_PRESETS.map((preset) => {
          const active = period.preset === preset.id;
          return (
            <Button
              key={preset.id}
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                setOpen(false);
                onChange(getPeriodForPreset(preset.id));
              }}
              className={cn(
                "h-8 rounded-md px-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300",
                active &&
                  "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
              )}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
