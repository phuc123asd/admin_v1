import axios from 'axios';
import { ChatbotResponse, ChatHistoryItem } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
});

export const chatService = {
  sendMessage: async (question: string, role: string, chatHistory: ChatHistoryItem[], images: File[] = [], isFormSubmit = false) => {
    const formData = new FormData();
    formData.append('question', question);
    formData.append('role', role);
    formData.append('chat_history', JSON.stringify(chatHistory));
    formData.append('is_form_submit', String(isFormSubmit));
    images.forEach(f => formData.append('images', f));

    const response = await apiClient.post<ChatbotResponse>('/chatbot/', formData);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/categories/');
    return response.data;
  },

  getBrands: async () => {
    const response = await apiClient.get('/brand/');
    return response.data;
  },
};

export default apiClient;
