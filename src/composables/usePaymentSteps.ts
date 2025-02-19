import { ref } from 'vue'

export function usePaymentSteps() {
  const currentStep = ref<Record<string, number>>({})
  const pkoinAmount = ref<Record<string, number>>({})
  const fiatAmount = ref<Record<string, number>>({})

  function initBuy(rowId: string) {
    if (!currentStep.value[rowId]) {
      currentStep.value[rowId] = 1
    }
  }

  function nextStep(rowId: string) {
    currentStep.value[rowId] = (currentStep.value[rowId] || 1) + 1
  }

  function confirmPayment(rowId: string) {
    alert(`Оплата подтверждена: строка — ${rowId}`)
  }

  function handleFileUpload(rowId: string, e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files || !input.files.length)
      return
    const file = input.files[0]
    console.log(`Загружаем чек для строки ${rowId}`, file)
  }

  return {
    currentStep,
    pkoinAmount,
    fiatAmount,
    initBuy,
    nextStep,
    confirmPayment,
    handleFileUpload,
  }
}
