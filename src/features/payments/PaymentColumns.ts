import type { ColumnDef } from "@tanstack/vue-table";
import type { Ref } from "vue";
import type { PaymentMethod } from "./types/PaymentMethod";
import { CaretSortIcon } from "@radix-icons/vue";
import { createColumnHelper, getCoreRowModel } from "@tanstack/vue-table";
import { Timer } from "lucide-vue-next";
import { h } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

const columnHelper = createColumnHelper<PaymentMethod>();

export function getPaymentColumns(
  pkoinPrice: Ref<{ RUB: number; USD: number } | null>,
  onBuy: (rowId?: number) => void,
): ColumnDef<PaymentMethod, any>[] {
  return [
    columnHelper.display({
      id: "makerInfo",
      header: "Мейкеры",
      cell: ({ row }) => {
        return [
          h("div", { class: "flex gap-2 items-center" }, [
            h(Avatar, { class: "h-7 w-7" }, [
              h(AvatarImage, { src: row.original.avatar ?? "" }),
              h(AvatarFallback, {}, row.original.userName?.[0]),
            ]),
            h("div", { class: "flex flex-col gap-2" }, [
              h("a", { class: "font-semibold" }, row.original.userName),
            ]),
          ]),
          h(
            "div",
            { class: "ml-9 text-accent-foreground text-xs" },
            `${row.original.completedOrders} ордеров`,
          ),
          h(
            "div",
            {
              class:
                "ml-9 text-muted-foreground text-xs mt-1 flex items-center gap-1",
            },
            [h(Timer, { class: "h-4 w-4" }), row.original.transferTime],
          ),
        ];
      },
    }),
    columnHelper.accessor("Цена", {
      header: ({ column }) =>
        h(
          Button,
          {
            variant: "ghost",
            class: "px-0",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          () => ["Цена", h(CaretSortIcon, { class: "ml-2 h-4 w-4" })],
        ),
      cell: ({ row }) => {
        const margin = row.original.margin;
        const rubPrice = pkoinPrice.value?.RUB ?? 0;
        return (margin * rubPrice).toFixed(2);
      },
    }),
    columnHelper.display({
      id: "fiatRangeRub",
      header: "Доступно/Лимит ордера",
      cell: ({ row }) => {
        const { minPkoin, maxPkoin, margin } = row.original;
        const rubRate = pkoinPrice.value?.RUB ?? 0;
        const minRub = (minPkoin * rubRate * margin).toFixed(2);
        const maxRub = (maxPkoin * rubRate * margin).toFixed(2);
        return `${maxPkoin} PKOIN / ₽${minRub} - ₽${maxRub}`;
      },
    }),
    columnHelper.display({
      id: "transfer",
      header: "Оплата",
      cell: ({ row }) => {
        return h(
          "div",
          { class: "flex gap-2 flex-wrap" },
          row.original.details?.map((detail) =>
            h(Badge, {}, () => detail.paymentMethod),
          ),
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Торгуй",
      cell: ({ row }) =>
        h(
          Button,
          {
            variant: "secondary",
            onClick: () => {
              row.toggleExpanded();
              onBuy(row.original.id);
            },
          },
          () => "Купить PKOIN",
        ),
    }),
  ];
}

export function getTableOptions(data, columns: any) {
  return {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };
}
