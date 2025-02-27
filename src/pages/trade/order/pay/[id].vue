<script setup lang="ts">
import { Clock, FileText, Loader2, Upload, XCircle } from 'lucide-vue-next'
import { ref } from 'vue'
import { SdkService } from '~/composables'
import { api } from '~/composables/api'
import { hexEncode } from '~/composables/hex'
const orderState = ref<
  'created' | 'uploading' | 'sending' | 'failed' | 'waiting' | 'completed'
>('created')

const paymentProof = ref<File | null>(null)
const paymentProofPreview = ref<string | null>(null)
const paymentProofName = ref<string | null>(null)
const orderData = ref()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  //@ts-ignore
  orderData.value = JSON.parse(sessionStorage.getItem('orderData'))
})

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер — 5MB.')
      return
    }

    paymentProof.value = file
    paymentProofName.value = file.name

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        paymentProofPreview.value = reader.result as string
      }
      reader.readAsDataURL(file)
    }
    else {
      paymentProofPreview.value = null
    }
  }
}



async function confirmPayment() {
  if (!paymentProof.value)
    return

  if (!('id' in route.params)) {
    return
  }

  orderState.value = 'sending'
  const account = await SdkService.getAccount()

  const formData = new FormData()
  formData.append('paymentProof', paymentProof.value)
  formData.append('unitPrice', orderData.value.unitPrice)
  formData.append('fiatCurrency', orderData.value.fiatCurrency)
  formData.append('fiatPrice', orderData.value.fiatPrice)
  formData.append('counterpartyAddress', account?.address ?? '')
  formData.append('paymentMethod', orderData.value.paymentMethod)
  formData.append('currency', orderData.value.currency)
  try {
    const response = await api.fetcher<any>(`/payments/${route.params.id}/add-order`, {
      method: 'POST',
      data: formData,
    })

    if (!response) {
      throw new Error('Ошибка при отправке данных')
    }

    const data = await SdkService.getOrCreateRoom(orderData.value.makerAddress ?? '')
    const userProfiles = await SdkService.rpc('getuserprofile', [account?.address])
    const pathToConfirm = `/trade/order/pay/confirm?orderId=${response.order?.id}&paymentId=${response.order.paymentId}`
  const messagesForSend = {
  ru:`
Ваши PKOIN были куплены!
Покупатель оплатил ${response.order?.fiatPrice} ${response.order?.fiatCurrency} через ${response.order?.paymentMethod}.
Пожалуйста, подтвердите сделку и переведите ${response.order?.fiatPrice / response.order?.unitPrice} PKOIN на адрес покупателя: ${response.order?.counterpartyAddress}.
➡️ Подтвердить сделку: https://bastyon.com/application?id=p2p.pkoin.app&p=${hexEncode(pathToConfirm)}`,

  default: `
Your PKOIN have been purchased!
The buyer has paid ${response.order?.fiatPrice} ${response.order?.fiatCurrency} via ${response.order?.paymentMethod}.
Please confirm the transaction and send ${response.order?.fiatPrice / response.order?.unitPrice} PKOIN to the buyer's address: ${response.order?.counterpartyAddress}.
➡️ Confirm the transaction: https://bastyon.com/application?id=p2p.pkoin.app&p=${hexEncode(pathToConfirm)}`
}
    if (data?.roomid) {
      //@ts-ignore
      await SdkService.sendMessage(data.roomid, messagesForSend?.[userProfiles?.[0]?.l] ||messagesForSend?.default )
    }
    router.push(pathToConfirm)
    orderState.value = 'waiting'
  }
  catch (error) {
    console.error('Ошибка:', error)
    orderState.value = 'failed'
  }
}

function retryUpload() {
  orderState.value = 'uploading'
  paymentProof.value = null
  paymentProofPreview.value = null
  paymentProofName.value = null
}
</script>

<template>
  <div class="flex justify-center items-center">
    <div class="w-full max-w-2xl text-foreground p-6 rounded-2xl">
      <div v-if="orderState === 'created'">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            Ордер создан
          </h2>
          <div class="bg-primary/20 p-2 rounded-full">
            <Clock class="text-primary w-6 h-6" />
          </div>
        </div>

        <div class="bg-muted rounded-xl p-5 border border-border">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-destructive text-lg font-medium">Купить</span>
            <span class="font-semibold text-lg">PKOIN</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col">
              <span class="text-muted-foreground">Цена</span>
              <span class="font-semibold">{{ orderData?.unitPrice?.toFixed(2) }} {{ orderData?.currency }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground">Сумма в фиате</span>
              <span class="font-semibold">{{ orderData?.fiatPrice }} {{ orderData?.fiatCurrency }}</span>
            </div>
          </div>
        </div>

        <div class="mt-6 border p-5 rounded-2xl bg-secondary text-secondary-foreground">
          <h3 class="text-lg font-semibold mb-2">
            Инструкция по оплате
          </h3>
          <p class="text-sm">
           {{ orderData?.makerConditions }}
          </p>
        </div>

        <div class="mt-6">
          <Button variant="outline" class="w-full text-lg" @click="orderState = 'uploading'">
            Подтвердить оплату
          </Button>
        </div>
      </div>

      <div v-else-if="orderState === 'uploading'">
        <h2 class="text-2xl font-semibold mb-6 text-center">
          Загрузите чек или другие подтверждающие оплату документы
        </h2>

        <div class="flex flex-col items-center">
          <input
            id="upload-check"
            type="file"
            accept="image/*,application/pdf"
            class="hidden"
            @change="handleFileUpload"
          >
          <label
            for="upload-check"
            class="flex items-center justify-center w-full max-w-sm border border-border p-4 rounded-lg cursor-pointer hover:bg-muted transition"
          >
            <Upload class="w-6 h-6 mr-2" />
            <span class="text-lg">Выбрать файл</span>
          </label>
        </div>

        <div v-if="paymentProofPreview" class="mt-6 relative flex justify-center">
          <img :src="paymentProofPreview" alt="Чек" class="rounded-lg w-full max-w-xs object-cover shadow-md">
          <button class="absolute top-2 right-2 bg-black/50 p-1 rounded-full" @click="retryUpload">
            <XCircle class="w-6 h-6 text-destructive" />
          </button>
        </div>

        <div
          v-if="paymentProofName && !paymentProofPreview"
          class="mt-6 flex items-center gap-2 bg-muted p-3 rounded-lg border border-border"
        >
          <FileText class="w-6 h-6 text-primary" />
          <span class="text-sm truncate">{{ paymentProofName }}</span>
          <button class="ml-auto" @click="retryUpload">
            <XCircle class="w-6 h-6 text-destructive" />
          </button>
        </div>

        <Button :disabled="!paymentProof" class="w-full mt-6 text-lg" @click="confirmPayment">
          Подтвердить оплату
        </Button>
      </div>

      <div v-else-if="orderState === 'sending'">
        <h2 class="text-2xl font-semibold mb-6 text-center">
          Отправка данных...
        </h2>
        <div class="flex items-center justify-center">
          <Loader2 class="text-primary w-8 h-8 animate-spin" />
        </div>
      </div>

      <div v-else-if="orderState === 'failed'">
        <h2 class="text-2xl font-semibold mb-6 text-center text-destructive">
          Ошибка отправки
        </h2>
        <p class="text-muted-foreground text-center text-lg">
          Не удалось отправить документ. Попробуйте снова.
        </p>
        <Button class="w-full mt-6 text-lg" @click="retryUpload">
          Загрузить заново
        </Button>
      </div>

      <div v-else-if="orderState === 'waiting'">
        <h2 class="text-2xl font-semibold mb-6 text-center">
          Ожидание подтверждения
        </h2>
        <p class="text-muted-foreground text-center text-lg">
          Макер подтвердит оплату в течение 30 минут, и PKOIN переведутся к вам.
        </p>
      </div>
    </div>
  </div>
</template>
