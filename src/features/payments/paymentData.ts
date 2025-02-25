import type { PaymentMethod } from './types/PaymentMethod'

export const paymentData: PaymentMethod[] = [
  {
    details: [
      {
        currency: ['RUB', 'USD'],
        paymentMethod: 'Банковский перевод',
        instructions: 'ДА КАК_ТО ТАК',
        availableFor: ['russia'],
      },
    ],
    minPkoin: 50,
    maxPkoin: 500,
    margin: 1.1,
    userName: 'pkoin888',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSXBh1B424BFvVziNeSw2J7u8u5XsdhVsdnw&s',
    address: 'pkoin888',
    completedOrders: 22,
    telegram: '@exchange_bot',
    transferTime: '30 минут',
  },
]
