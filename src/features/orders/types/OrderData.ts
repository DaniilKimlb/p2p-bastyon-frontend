export type OrderStatus = "pending" | "paid" | "canceled";

export interface OrderData {
  id: string;
  unitPrice: number;
  fiatCurrency: number;
  fiatPrice: number;
  paymentMethod: string;
  currency: string;
  counterpartyAddress: string;
  status: OrderStatus;
  paymentProof: string;
}
