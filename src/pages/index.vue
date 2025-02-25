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

if(account.value.address !== 'PKzsFvWfvbKoAvBw8Wh1oGPMTChSwwN3aU'){
  router.push(`trade/all-payments/`)
}else {
  router.push('/trade/orders')
}
</script>
