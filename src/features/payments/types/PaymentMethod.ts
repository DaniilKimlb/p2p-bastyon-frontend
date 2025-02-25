export interface PaymentMethod {
  id?: number
  details: {
    currency: string[]
    paymentMethod: string
    instructions: string
    availableFor: string[]
  }[]
  minPkoin: number
  maxPkoin: number
  margin: number
  transferTime?: string

  telegram?: string
  userName: string
  avatar: string
  address: string
  completedOrders: number
}
