<script lang="ts" setup>
import OrderTable from '~/features/orders/OrderTable.vue'
import AddPaymentModal from '~/features/payments/AddPaymentModal.vue'

</script>

<template>
  <div class="mb-2">
    <AddPaymentModal />
  </div>
  <OrderTable />
</template>
