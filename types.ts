
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  sizes: string[];
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export interface OrderData {
  customerName: string;
  phone: string;
  address: string;
  cart: CartItem[];
  total: number;
  subtotal: number;
  shippingMethod: 'modiin' | 'israel';
  shippingCost: number;
  paymentMethod: 'bit';
}
