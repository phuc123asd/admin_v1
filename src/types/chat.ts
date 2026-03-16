import { ChartData } from '../components/chat/ChatChart';
import { OrderData } from '../components/chat/OrderApprovalCard';

export interface ProductFormData {
  id?: string;
  name: string;
  price: string;
  originalPrice: string;
  category: string;
  brand: string;
  description: string;
  features: string[];
  specifications: { key: string; value: string }[];
  isNew: boolean;
  inStock: boolean;
  mainImage?: string;
  galleryImages?: string[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
  type?: 'chat' | 'product_form' | 'chart' | 'order_approval';
  formPrefill?: Partial<ProductFormData>;
  chartData?: ChartData;
  orderApprovalData?: OrderData[];
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponse {
  action: 'show_order_approval' | 'show_product_form' | 'draw_chart' | 'general_chat' | 'statistics' | 'navigate' | string;
  answer?: string;
  message?: string;
  orders?: OrderData[];
  prefill?: Partial<ProductFormData>;
  title?: string;
  type?: string;
  data?: any[];
  xAxisKey?: string;
  dataKeys?: string[];
  payload?: {
    path: string;
  };
  success?: boolean;
  error?: string;
}
