<script setup lang="ts" generic="T extends any, O extends any">
import { SdkService } from '~/composables'

defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const account = ref()

onMounted(async () => {
  account.value = await SdkService.getAccount()
})
watchEffect(() => {
  const makers = ['PMZ3DiGWKGybLb5oCz9ojwxuTBA6GcYAKq', 'PLpzAiA6H8isp33WeVx2UEuXLfc3SyqkzK', 'PEL45oK7ppFhB69G6GSsMLxHatNu5FJc5P']
  if(!account.value) return
  if(!makers.includes(account.value?.address)){
  router.push(`trade/all-payments/`)
}else {
  router.push('/trade/orders')
}
})

</script>

<template>
  <div class="text-center py-10">Загрузка данных...</div>
</template>
