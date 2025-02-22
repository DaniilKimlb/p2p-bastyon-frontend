import type { ColumnDef } from "@tanstack/vue-table";
import { createColumnHelper, getCoreRowModel } from "@tanstack/vue-table";
import { h } from "vue";
import { Badge } from "~/components/ui/badge";
import { OrderData } from "./types/OrderData";
import { Button } from "~/components/ui/button";
import { router } from "~/main";
import { APP_API_URL } from "~/config";

const columnHelper = createColumnHelper<OrderData>();

const paymentStatus = {
  pending: {
    label: "Ожидается подтверждение",
    styles: "bg-yellow-400",
  },
  paid: {
    label: "Подтверждено",
    styles: "bg-green-400",
  },
  canceled: {
    label: "Отказано",
    styles: "bg-red-400",
  },
};

export function getOrderColumns(
  onViewProfile: (address: string) => void,
): ColumnDef<OrderData, any>[] {
  return [
    columnHelper.accessor("paymentMethod", {
      header: "Метод оплаты",
      cell: ({ row }) => h("span", {}, row.original.label),
    }),
    columnHelper.accessor("unitPrice", {
      header: "Цена за ед.",
      cell: ({ row }) => `${row.original.unitPrice} ${row.original.currency}`,
    }),
    columnHelper.accessor("fiatCurrency", {
      header: "Фиатная валюта",
      cell: ({ row }) => h("span", {}, row.original.fiatCurrency),
    }),
    columnHelper.accessor("fiatCurrency", {
      header: "Сумма в фиате",
      cell: ({ row }) => h("span", {}, row.original.fiatPrice),
    }),
    columnHelper.display({
      id: "counterparty",
      header: "Покупатель",
      cell: ({ row }) =>
        h(
          "a",
          {
            href: "#",
            class: "text-blue-500 hover:underline",
            onClick: () => onViewProfile(row.original.counterpartyAddress),
          },
          row.original.counterpartyAddress ?? "-",
        ),
    }),
    columnHelper.display({
      id: "status",
      header: "Статус",
      cell: ({ row }) =>
        h(
          Badge,
          {
            class: paymentStatus?.[row.original?.status || "pending"].styles,
          },
          paymentStatus?.[row.original?.status || "pending"].label,
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Доказательство оплаты",
      cell: ({ row }) =>
        h(
          "a",
          {
            href: `${APP_API_URL}${row.original.paymentProof}`,
            target: "_blank",
            class: "text-blue-500 hover:underline",
          },
          "Смотреть",
        ),
    }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: ({ row }) =>
            h(
              Button,
              {
                variant: "secondary",
                onClick: () => {
                  row.toggleExpanded();
                  router.push('/trade/order_copy_copy')
                },
              },
              () => "Открыть",
            ),
        }),
  ];
}

export function getTableOptions(data: any, columns: any) {
  return {
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  };
}
