"use client";

import { useEffect, useId, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis";

function getPageItems(current: number, total: number, siblingCount = 1): PageItem[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const maxVisible = siblingCount * 2 + 5;
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = 3 + 2 * siblingCount;
    return [
      ...Array.from({ length: leftCount }, (_, i) => i + 1),
      "ellipsis",
      total,
    ];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = 3 + 2 * siblingCount;
    return [
      1,
      "ellipsis",
      ...Array.from({ length: rightCount }, (_, i) => total - rightCount + 1 + i),
    ];
  }

  return [
    1,
    "ellipsis",
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i),
    "ellipsis",
    total,
  ];
}

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const navBtnClass = "size-8 p-0";

export interface TablePaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  itemLabel?: { singular: string; plural: string };
  className?: string;
}

export function TablePagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  itemLabel = { singular: "item", plural: "itens" },
  className,
}: TablePaginationProps) {
  const jumpId = useId();
  const perPageId = useId();
  const totalPages = Math.max(1, Math.ceil(total / perPage) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);
  const noun = total === 1 ? itemLabel.singular : itemLabel.plural;

  const [jump, setJump] = useState(String(safePage));

  useEffect(() => {
    setJump(String(safePage));
  }, [safePage]);

  useEffect(() => {
    if (total > 0 && page > totalPages) onPageChange(totalPages);
  }, [page, total, totalPages, onPageChange]);

  if (total === 0) return null;

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) onPageChange(clamped);
  };

  const submitJump = () => {
    const n = Number(jump.trim());
    if (Number.isInteger(n) && n > 0) go(n);
    else setJump(String(safePage));
  };

  const items = getPageItems(safePage, totalPages);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <p className="text-sm text-zinc-500">
        Mostrando{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{total}</span>{" "}
        {noun}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPerPageChange && (
          <label htmlFor={perPageId} className="mr-1 flex items-center gap-2 text-xs text-zinc-500">
            Por página
            <select
              id={perPageId}
              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              value={perPage}
              onChange={(e) => {
                onPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <nav aria-label="Paginação" className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={navBtnClass}
            disabled={safePage <= 1}
            onClick={() => go(1)}
            aria-label="Primeira página"
            title="Primeira página"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={navBtnClass}
            disabled={safePage <= 1}
            onClick={() => go(safePage - 1)}
            aria-label="Página anterior"
            title="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {items.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex size-8 items-center justify-center text-sm text-zinc-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === safePage ? "default" : "outline"}
                size="sm"
                className={navBtnClass}
                onClick={() => go(item)}
                aria-label={`Página ${item}`}
                aria-current={item === safePage ? "page" : undefined}
              >
                {item}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={navBtnClass}
            disabled={safePage >= totalPages}
            onClick={() => go(safePage + 1)}
            aria-label="Próxima página"
            title="Próxima página"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={navBtnClass}
            disabled={safePage >= totalPages}
            onClick={() => go(totalPages)}
            aria-label="Última página"
            title="Última página"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </nav>

        {totalPages > 5 && (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              submitJump();
            }}
          >
            <label htmlFor={jumpId} className="text-xs text-zinc-500">
              Ir para
            </label>
            <Input
              id={jumpId}
              type="number"
              min={1}
              max={totalPages}
              inputMode="numeric"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onBlur={submitJump}
              className="h-8 w-14 px-2 text-center"
              aria-label="Ir para a página"
            />
          </form>
        )}
      </div>
    </div>
  );
}
