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
  if(!account.value) return
  if(account.value?.address !== 'PPVgnH4N22yriNu9HsvViXjshNFy3BLqoJ'){
  router.push(`trade/all-payments/`)
}else {
  router.push('/trade/orders')
}
})

</script>

<template>
  <div class="text-center py-10">Загрузка данных...</div>
</template>
