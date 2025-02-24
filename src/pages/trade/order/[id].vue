<script setup lang="ts">
import type { PaymentMethod } from '~/features/payments/types/PaymentMethod'
import { toTypedSchema } from '@vee-validate/zod'
import { ChevronDown, Landmark, Loader2 } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import * as z from 'zod'
import { FormField } from '~/components/ui/form'
import Big from 'big.js'
import { api } from "~/composables/api";

const { pkoinPrice } = usePKoinPrice()
const route = useRoute()

const paymentData = ref<PaymentMethod>()
const isLoading = ref(true)
const errorMessage = ref(null)
const router = useRouter()
const selectedCurrency = computed(() => route.query?.fiatCurrency)

async function fetchPaymentDetails() {
  isLoading.value = true
  errorMessage.value = null

  try {
    if (!('id' in route.params)) {
      return
    }
    const response = await api.fetcher<any>(`/payments/${route.params.id}`, {
      method: "GET"
    })
    paymentData.value = response.data
  }
  catch (error: any) {
    errorMessage.value = error?.message
  }
  finally {
    isLoading.value = false
  }
}

watchEffect(() => {
  fetchPaymentDetails()
})

const minPkoin = computed(() => paymentData.value?.minPkoin ?? 0)
const maxPkoin = computed(() => paymentData.value?.maxPkoin ?? 0)

const minAmountFiat = computed(() =>
  pkoinPrice.value && paymentData.value
    ? new Big(paymentData.value.minPkoin)
        .times(pkoinPrice.value.RUB)
        .times(paymentData.value.margin)
        .toNumber()
    : 0,
)

const maxAmountFiat = computed(() =>
  pkoinPrice.value && paymentData.value
    ? new Big(paymentData.value.maxPkoin)
        .times(pkoinPrice.value.RUB)
        .times(paymentData.value.margin)
        .toNumber()
    : 0,
)

const formSchema = computed(() =>
  toTypedSchema(
    z.object({
      amountFiat: z.number().min(
        minAmountFiat.value,
        `Минимальная сумма: ${minAmountFiat.value} ${selectedCurrency.value}`,
      ).max(
        maxAmountFiat.value,
        `Максимальная сумма: ${maxAmountFiat.value} ${selectedCurrency.value}`,
      ),
      amount: z.number().min(
        minPkoin.value ?? 0,
        `Минимальная сумма: ${minPkoin.value} PKOIN`,
      ).max(
        maxPkoin.value ?? 0,
        `Максимальная сумма: ${maxPkoin.value} PKOIN`,
      ),
      paymentMethod: z.string().min(1, 'Выберите способ оплаты'),
    }),
  ),
)

const form = useForm({
  validationSchema: formSchema,
})

const [amountFiat] = form.defineField('amountFiat')
const [amount] = form.defineField('amount')

const receivedPkoin = computed(() => {
  if (!pkoinPrice.value?.RUB || !paymentData.value?.margin) return 0

  return new Big(amountFiat.value ?? 0)
    .div(new Big(pkoinPrice.value.RUB).times(paymentData.value.margin))
    .toPrecision(6)
})

const receivedFiat = computed(() => {
  if (!pkoinPrice.value?.RUB || !paymentData.value?.margin) return 0

  return new Big(amount.value ?? 0)
    .times(new Big(pkoinPrice.value.RUB).times(paymentData.value.margin))
    .toPrecision(6)
})

watch(amountFiat, (newVal) => {
  if (newVal !== null && pkoinPrice.value) {
    form.setFieldValue('amount', +receivedPkoin.value)
  }
})

watch(amount, (newVal) => {
  if (newVal !== null && pkoinPrice.value) {
    form.setFieldValue('amountFiat', +receivedFiat.value)
  }
})

const showPaymentModal = ref(false)
const selectedPaymentMethod = ref<string | null>(null)

const paymentMethods = computed(() => {
  return paymentData.value?.details.map(p => p.paymentMethods) ?? []
})

const bankInstructions = computed(() => {
  return Object.fromEntries(paymentData.value?.details.map(p => [p.paymentMethods, p.instructions]) ?? [])
})

const makerConditionsTitle = computed(() =>
  selectedPaymentMethod.value
    ? 'Условия мейкера (прочитайте внимательно)'
    : 'Выберите способ оплаты',
)

const makerConditionsText = computed(() => {
  if (!selectedPaymentMethod.value) {
    return 'Для продолжения выберите способ оплаты в правой части экрана.'
  }
  return bankInstructions.value[selectedPaymentMethod.value]
})

function selectPaymentMethod(method: string) {
  selectedPaymentMethod.value = method
  showPaymentModal.value = false
  form.setFieldValue('paymentMethod', method)
}

const onSubmit = form.handleSubmit((values) => {
  const orderData = {
    unitPrice: (pkoinPrice.value?.RUB ?? 0) * (paymentData.value?.margin ?? 0),
    amountFlat: values.amountFiat,
    amount: values.amount,
    fiatCurrency: selectedCurrency.value,
    paymentMethod: values.paymentMethod,
    currency: 'PKOIN',
    makerConditions: makerConditionsText.value,
    makerAddress: paymentData.value?.address
  }

  sessionStorage.setItem('orderData', JSON.stringify(orderData))
  router.push('/trade/order_copy')
})
</script>

<template>
  <div v-if="isLoading || !pkoinPrice">
        <h2 class="text-2xl font-semibold mb-6 text-center">
          Загружаем данные...
        </h2>
        <div class="flex items-center justify-center">
          <Loader2 class="text-primary w-8 h-8 animate-spin" />
        </div>
      </div>
  <Card v-else
    class="max-w-screen-xl border-none mx-auto md:flex space-y-6 md:space-y-0 bg-card text-foreground"
  >
    <div class="md:flex-1 md:pr-6">
      <div class="flex items-center gap-3 mb-6">
        <Avatar>
          <AvatarImage :src="paymentData?.avatar ?? ''" />
          <AvatarFallback>
            {{
              paymentData?.userName?.[0] ?? ""
            }}
          </AvatarFallback>
        </Avatar>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ paymentData?.userName }}</span>
          </div>
          <div class="text-sm text-muted-foreground">
            <span>{{ paymentData?.completedOrders }} ордеров</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div>
          <div class="text-xl font-medium">
            15 мин.
          </div>
          <div class="text-sm text-muted-foreground">
            Срок оплаты
          </div>
        </div>
      </div>

      <div class="text-muted-foreground mb-3">
        {{ makerConditionsTitle }}
      </div>
      <div class="text-foreground">
        {{ makerConditionsText }}
      </div>
    </div>

    <Card
      class="w-full md:w-[400px] bg-secondary text-secondary-foreground p-4 mt-6 md:mt-0"
    >
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <span class="text-muted-foreground">Цена</span>
          <span class="text-green-500 text-xl">{{
((pkoinPrice?.RUB ?? 0) * (paymentData?.margin || 0)).toFixed(2)
          }}</span>
        </div>

        <form id="dad" class="space-y-4" novalidate @submit="onSubmit">
          <div class="text-muted-foreground mb-2">
            Вы платите
          </div>
          <FormField v-slot="{ componentField, errors }" name="amountFiat">
            <FormItem>
              <div
                class="bg-card rounded-lg border p-2 flex items-center justify-between"
                :class="errors?.[0] && 'border-destructive'"
              >
                <FormControl>
                  <Input
                    type="number"
                    v-bind="componentField"
                    :placeholder="`${minAmountFiat}-${maxAmountFiat}`"
                    class="bg-transparent appearance-none border-0 outline-none p-0 border-none outline-0 focus:ring-0 text-foreground placeholder-muted-foreground w-full focus:border-transparent"
                  />
                </FormControl>
                <div class="flex items-center gap-2 ml-2">
                  <div class="flex items-center gap-1">
                    <span class="text-foreground">{{ selectedCurrency }}</span>
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField, errors }" name="amount">
            <div class="text-muted-foreground mb-2">
              Вы получите
            </div>
            <FormItem>
              <div
                class="bg-card rounded-lg border p-2 flex items-center justify-between"
                :class="errors?.[0] && 'border-destructive'"
              >
                <FormControl>
                  <Input
                    type="number"
                    v-bind="componentField"
                    :placeholder="`${minPkoin}-${maxPkoin}`"
                    class="bg-transparent appearance-none border-0 outline-none p-0 border-none outline-0 focus:ring-0 text-foreground placeholder-muted-foreground w-full focus:border-transparent"
                  />
                </FormControl>
                <div class="flex items-center gap-2 ml-2">
                  <div class="flex items-center gap-1">
                    <span class="text-foreground">PKOIN</span>
                  </div>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField name="paymentMethod">
            <FormItem>
              <div class="text-muted-foreground mb-2">
                Способ оплаты
              </div>
              <Dialog v-model:open="showPaymentModal">
                <DialogTrigger as-child>
                  <Button variant="outline" class="w-full justify-between">
                    <span v-if="selectedPaymentMethod">
                      {{ selectedPaymentMethod }}
                    </span>
                    <span v-else class="text-muted-foreground">Выберите способ оплаты</span>
                    <ChevronDown class="h-4 w-4 ml-2" />
                  </Button>
                </DialogTrigger>

                <DialogContent class="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Способы оплаты</DialogTitle>
                  </DialogHeader>
                  <div class="flex flex-col space-y-2 mt-2">
                    <Button
                      v-for="method in paymentMethods"
                      :key="method"
                      variant="ghost"
                      class="justify-start"
                      @click="selectPaymentMethod(method)"
                    >
                      <Landmark class="mr-2 h-4 w-4" />
                      {{ method }}
                    </Button>
                  </div>
                  <DialogFooter>
                    <DialogClose>Закрыть</DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <FormMessage />
            </FormItem>
          </FormField>

          <div class="grid grid-cols-2 gap-3">
            <Button variant="destructive">
              Отменить
            </Button>
            <Button form="dad" type="submit">
              Купить PKOIN
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </Card>
</template>
