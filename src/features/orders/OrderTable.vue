<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useVueTable, FlexRender } from "@tanstack/vue-table";
import { getOrderColumns, getTableOptions } from "./OrderColumns";
import { OrderData } from "./types/OrderData";
import { api } from "~/composables/api";
import { PaymentMethod } from "~/features/payments/types/PaymentMethod";


interface Props {
  mePayment: PaymentMethod
}

const props = withDefaults(defineProps<Props>(), {})

const isLoading = ref(true);
const orderData = ref<OrderData[]>([]);
const router = useRouter();

const page = ref(1);
const limit = ref(10);
const totalPages = ref(1);
const totalOrders = ref(0);

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const response = await api.fetcher<any>(
      `/payments/${props.mePayment.id}/orders?page=${page.value}&limit=${limit.value}`, {
        method: "GET"
      }
    );
    orderData.value = response.orders;
    totalPages.value = response.pagination.totalPages;
    totalOrders.value = response.pagination.totalOrders;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
  } finally {
    isLoading.value = false;
  }
};

watchEffect(() => {
  fetchOrders();
});

const columns = computed(() =>
  getOrderColumns(({orderId}) => {
    console.log(orderId, 'orderId')
    console.log(props.mePayment.id, 'paymentId')
    router.push(`/trade/order/pay/confirm?orderId=${orderId}&paymentId=${props.mePayment.id}`);
  })
);
const tableOptions = computed(() => getTableOptions(orderData, columns.value));

const table = useVueTable({
  ...tableOptions.value,
  state: {},
});

const goToNextPage = () => {
  if (page.value < totalPages.value) {
    page.value += 1;
  }
};

const goToPrevPage = () => {
  if (page.value > 1) {
    page.value -= 1;
  }
};

</script>
<template>
  <div v-if="isLoading" class="text-center py-10">Загрузка данных...</div>

  <div v-else class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead v-for="header in headerGroup.headers" :key="header.id">
            <FlexRender
              v-if="!header.isPlaceholder"
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <template v-if="table.getRowModel().rows.length">
          <template v-for="row in table.getRowModel().rows" :key="row.id">
            <TableRow>
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
        </template>

        <TableRow v-else>
          <TableCell :colspan="columns.length" class="h-24 text-center">
            Нет данных
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Пагинация -->
    <div class="flex justify-between items-center p-4">
      <button @click="goToPrevPage" :disabled="page === 1" class="px-4 py-2 bg-gray-200 rounded">
        Назад
      </button>
      <span>Страница {{ page }} из {{ totalPages }}</span>
      <button @click="goToNextPage" :disabled="page === totalPages" class="px-4 py-2 bg-gray-200 rounded">
        Вперед
      </button>
    </div>
  </div>
</template>
