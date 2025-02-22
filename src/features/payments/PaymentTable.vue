<script setup lang="ts">
import { FlexRender, useVueTable } from '@tanstack/vue-table'
import { DollarSign, RussianRuble } from 'lucide-vue-next'
import { ref, watchEffect, computed } from 'vue'
import { usePKoinPrice } from '~/composables/usePKoinPrice'
import { cn } from '~/composables/utils'
import { getPaymentColumns, getTableOptions } from './PaymentColumns'
import { api } from '~/composables/api'

const { pkoinPrice } = usePKoinPrice()

const sorting = ref([])
const columnFilters = ref([])
const columnVisibility = ref({})
const rowSelection = ref({})
const expanded = ref({})
const isLoading = ref(true)
const paymentData = ref([])

const selectedCurrency = ref('rub')

const fetchPayments = async () => {
  isLoading.value = true
  try {
    const response = await api.fetcher<{data: any}>(`/payments?currency=${selectedCurrency.value.toUpperCase()}`, {
      method: "GET"
    })
    paymentData.value = response.data
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
  } finally {
    isLoading.value = false
  }
}

const router = useRouter()

watchEffect(() => {
  fetchPayments()
})

const columns = computed(() => getPaymentColumns(pkoinPrice, (orderId) => {
  router.push(`/trade/order/${orderId}`)
}))
const tableOptions = computed(() => getTableOptions(paymentData, columns.value))

const table = useVueTable({
  ...tableOptions.value,
  onSortingChange: val => (sorting.value = val),
  onColumnFiltersChange: val => (columnFilters.value = val),
  onColumnVisibilityChange: val => (columnVisibility.value = val),
  onRowSelectionChange: val => (rowSelection.value = val),
  onExpandedChange: val => (expanded.value = val),
  state: {
    sorting: sorting.value,
    columnFilters: columnFilters.value,
    columnVisibility: columnVisibility.value,
    rowSelection: rowSelection.value,
    expanded: expanded.value,
  },
})
</script>

<template>
  <div class="flex gap-2 items-center py-4">
    <Select v-model="selectedCurrency">
      <SelectTrigger class="w-fit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="rub">
          <div class="flex items-center gap-1">
            <RussianRuble class="w-4 h-4" />
            RUB
          </div>
        </SelectItem>
        <SelectItem value="usd">
          <div class="flex items-center gap-1">
            <DollarSign class="w-4 h-4" />
            USD
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div v-if="isLoading" class="text-center py-10">Загрузка данных...</div>

  <div v-else class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :data-pinned="header.column.getIsPinned()"
            :class="
              cn(
                { 'sticky bg-background/95': header.column.getIsPinned() },
                header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
              )
            "
          >
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
            <TableRow :data-state="row.getIsSelected() && 'selected'">
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :data-pinned="cell.column.getIsPinned()"
                :class="
                  cn(
                    { 'sticky bg-background/95': cell.column.getIsPinned() },
                    cell.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                  )
                "
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
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
  </div>
</template>
