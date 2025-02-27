<script setup lang="ts" generic="T extends any, O extends any">
import { SdkService } from '~/composables'
import { makers } from '~/config'

defineOptions({
  name: 'IndexPage',
})

const router = useRouter()
const account = ref()

onMounted(async () => {
  account.value = await SdkService.getAccount()
})
watchEffect(() => {

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
