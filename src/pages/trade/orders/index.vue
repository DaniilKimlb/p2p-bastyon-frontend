<script lang="ts" setup>
import OrderTable from '~/features/orders/OrderTable.vue'
import AddPaymentModal from '~/features/payments/AddPaymentModal.vue'
import { ref, onMounted } from 'vue'
import { api } from '~/composables/api'
import { makers } from '~/config'

const mePayment = ref()
const fetchState = ref<'idle' | 'loading' | 'success' | 'error'>('idle')

const fetchMePayment = async () => {
  fetchState.value = 'loading'
  try {
    const response = await api.fetcher<{ data: any }>('/payments/address/me', {
      method: 'GET',
    })
    mePayment.value = response.data
    fetchState.value = 'success'
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error)
    fetchState.value = 'error'
  }
}

onMounted(() => {
  fetchMePayment()
})
</script>

<template>

  <div v-if="fetchState === 'loading'" class="text-center py-4">
    ⏳ Загрузка данных...
  </div>

  <div v-else-if="fetchState === 'error'" class="text-center py-4 text-destructive">
    ❌ Ошибка загрузки данных. Попробуйте позже.
  </div>
  <template v-else-if="fetchState === 'success'">
    <div class="mb-2">
      <AddPaymentModal :me-payment="mePayment" />
    </div>
    <OrderTable  v-if="mePayment" :me-payment="mePayment" />
    <div v-else class="text-center py-4 text-muted-foreground">
      🕵️ Ваши платежи не настроены.
    </div>
  </template>
  <div v-else class="text-center py-4">
    🕵️ Нет данных.
  </div>
</template>
