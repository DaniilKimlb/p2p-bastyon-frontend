import { onMounted, ref } from 'vue'

export function usePKoinPrice() {
  const pkoinPrice = ref<{ USD: number, RUB: number } | null>(null)

  onMounted(() => {
    fetch('https://min-api.cryptocompare.com/data/price?fsym=PKOIN&tsyms=USD,RUB')
      .then((res) => {
        if (!res.ok)
          throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        pkoinPrice.value = data
      })
      .catch(() => {
        pkoinPrice.value = { USD: 0, RUB: 0 }
      })
  })

  return { pkoinPrice }
}
