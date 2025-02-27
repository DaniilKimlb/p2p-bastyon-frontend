<script setup lang="ts">
import { Clock, Loader2, Check, X, ArrowLeft } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'
import { SdkService } from '~/composables'
import { api } from '~/composables/api'
import { APP_API_URL } from '~/config'

const orderState = ref<'loading' | 'pending' | 'confirming' | 'canceled' | 'failed' | 'paid'>('loading')
const paymentProof = ref<string | null>(null)
const orderData = ref<any>(null)
const account = ref<any>(null)
const updatingStatus = ref(false)

const route = useRoute()

onMounted(async () => {
  account.value = await SdkService.getAccount()
  await fetchOrder()
})

async function fetchOrder() {
  try {
    const response = await api.fetcher<any>(`/payments/${route.query.paymentId}/orders/${route.query.orderId}`, {
      method: "GET"
    })
    orderData.value = response.order
    paymentProof.value = orderData.value.paymentProof

    orderState.value = orderData.value.status
  } catch (error) {
    console.error('Ошибка получения ордера:', error)
    orderState.value = 'failed'
  }
}

async function updateOrderStatus(status: 'paid' | 'canceled') {
  try {
    updatingStatus.value = true

    if (status === 'paid') {
      const paymentResult = await SdkService.payment([{
        address: orderData.value.counterpartyAddress,
        amount: orderData.value.fiatPrice / orderData.value.unitPrice
      }])


      if (paymentResult.rejected === false){
        orderState.value = 'failed'
        updatingStatus.value = false
        return
      }
    }

    await api.fetcher(`/payments/${route.query.paymentId}/orders/${orderData.value.id}/status`, {
      method: 'PATCH',
      data: { status },
    })


    const pathToConfirm = `/trade/order/pay/confirm?paymentId=${orderData.value.paymentId}&orderId=${orderData.value.id}`
    const confirmLink = `https://bastyon.com/application?id=p2p.pkoin.app&p=${hexEncode(pathToConfirm)}`
    const userProfiles = await SdkService.rpc('getuserprofile', [orderData.value?.counterpartyAddress])


   const messagesForBuyer = {
      ru: {
        paid: `✅ Ваша оплата подтверждена!
        Продавец отправил ${orderData.value.fiatPrice / orderData.value.unitPrice} PKOIN на ваш адрес: ${orderData.value.counterpartyAddress}.
        ➡️ Посмотреть статус сделки: ${confirmLink}`,

        canceled: `❌ Ваш платеж был отклонен!
        Продавец отменил сделку.`
      },
      default: {
        paid: `✅ Your payment has been confirmed!
        The seller has sent ${orderData.value.fiatPrice / orderData.value.unitPrice} PKOIN to your address: ${orderData.value.counterpartyAddress}.
        ➡️ View transaction status: ${confirmLink}`,

        canceled: `❌ Your payment was rejected!
        The seller canceled the transaction.`
      }
    }
    const buyerRoom = await SdkService.getOrCreateRoom(orderData.value.counterpartyAddress)
    if (buyerRoom?.roomid) {
      //@ts-ignore
      await SdkService.sendMessage(buyerRoom.roomid, messagesForBuyer[userProfiles?.[0]?.l]?.[status] || messagesForBuyer.default[status])
    }
    orderState.value = status
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
    orderState.value = 'failed'
  } finally {
    updatingStatus.value = false
  }
}

const isMaker = computed(() => orderData.value?.makerAddress === account.value.address)
</script>

<template>
  <div class="flex justify-center items-center">
    <div class="w-full max-w-2xl text-foreground p-6 rounded-2xl">
       <div class="mb-4">
        <Button variant="outline" as-child>
          <router-link to='/'>
            <ArrowLeft class="w-5 h-5 mr-2" /> Назад
          </router-link>
        </Button>
      </div>
      <!-- 🔄 Загрузка данных -->
      <div v-if="orderState === 'loading'">
        <h2 class="text-2xl font-semibold mb-6 text-center">Загружаем данные...</h2>
        <div class="flex items-center justify-center">
          <Loader2 class="text-primary w-8 h-8 animate-spin" />
        </div>
      </div>

      <!-- 📌 Мейкер видит статус платежа -->
      <div v-else-if="isMaker">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">Подтверждение платежа</h2>
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
              <span class="text-muted-foreground">Цена в {{ orderData?.fiatCurrency }} за один {{ orderData?.currency }} </span>
              <span class="font-semibold">{{ orderData?.unitPrice.toFixed(2) }} {{ orderData?.fiatCurrency }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground">Сумма в фиате</span>
              <span class="font-semibold">{{ orderData?.fiatPrice }} {{ orderData?.fiatCurrency }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-muted-foreground">Сумма в {{ orderData?.currency }} </span>
              <span class="font-semibold">{{
                orderData.fiatPrice / orderData.unitPrice
                }} {{ orderData?.currency }}</span>
            </div>
          </div>
        </div>

        <div v-if="paymentProof" class="mt-6">
          <Button @click="SdkService.openExternalLink(APP_API_URL + paymentProof)">
            Посмотреть чек оплаты
          </Button>
        </div>

        <!-- 🔄 Кнопки подтверждения/отмены -->
        <div v-if="orderState === 'pending'" class="grid grid-cols-2 gap-3 mt-6">
          <Button variant="destructive" @click="updateOrderStatus('canceled')" :disabled="updatingStatus">
            <X class="w-5 h-5 mr-2" /> Отклонить
          </Button>
          <Button variant="secondary" @click="updateOrderStatus('paid')" :disabled="updatingStatus">
            <Check class="w-5 h-5 mr-2" /> Подтвердить
          </Button>
        </div>

        <!-- ✅ Оплачено -->
        <div v-else-if="orderState === 'paid'" class="mt-6 text-center">
          <h2 class="text-2xl font-semibold text-green-500">Оплата подтверждена</h2>
          <p class="text-muted-foreground">Транзакция завершена успешно.</p>
        </div>

        <!-- ❌ Отклонено -->
        <div v-else-if="orderState === 'canceled'" class="mt-6 text-center">
          <h2 class="text-2xl font-semibold text-red-500">Оплата отклонена</h2>
          <p class="text-muted-foreground">Вы отклонили этот платеж.</p>
        </div>
      </div>

      <!-- ⏳ Ожидание подтверждения -->
      <div v-else-if="orderState === 'pending'">
        <h2 class="text-2xl font-semibold mb-6 text-center">Ожидание подтверждения</h2>
        <p class="text-muted-foreground text-center text-lg">
          Макер подтвердит оплату в течение 30 минут, и PKOIN переведутся к вам.
        </p>
      </div>

      <!-- ✅ Оплачено (для покупателя) -->
      <div v-else-if="orderState === 'paid'">
        <h2 class="text-2xl font-semibold mb-6 text-center text-green-500">Оплата подтверждена</h2>
        <p class="text-muted-foreground text-center text-lg">
          Ваша транзакция успешно завершена.
        </p>
      </div>

      <!-- ❌ Отклонено (для покупателя) -->
      <div v-else-if="orderState === 'canceled'">
        <h2 class="text-2xl font-semibold mb-6 text-center text-destructive">Оплата отклонена</h2>
        <p class="text-muted-foreground text-center text-lg">
          Макер отклонил ваш платеж.
        </p>
      </div>

      <!-- ⚠️ Ошибка -->
      <div v-else-if="orderState === 'failed'">
        <h2 class="text-2xl font-semibold mb-6 text-center text-destructive">Ошибка</h2>
        <p class="text-muted-foreground text-center text-lg">Не удалось загрузить ордер.</p>
      </div>
    </div>
  </div>
</template>
