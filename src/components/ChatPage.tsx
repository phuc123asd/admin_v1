import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Paperclip } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
}

const initialMessages: Message[] = [
  {
    id: crypto.randomUUID(),
    text: 'Xin chào! Tôi có thể giúp bạn quản lý cửa hàng, phân tích dữ liệu, và trả lời câu hỏi về sản phẩm, đơn hàng. Bạn muốn biết điều gì?',
    sender: 'ai',
    timestamp: new Date(),
  },
];

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const sendUserMessage = async () => {
    if (!inputValue.trim() && selectedImages.length === 0) return;

    // Tạo URL ảnh để hiển thị (nếu có)
    const imageUrls = selectedImages.length > 0 
      ? selectedImages.map(img => URL.createObjectURL(img)) 
      : [];

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    const currentImages = [...selectedImages];
    setInputValue('');
    setSelectedImages([]);
    setIsTyping(true);

    try {
      // Tạo FormData để gửi cả text và file
      const formData = new FormData();
      formData.append('question', currentInput);
      formData.append('role', 'admin'); // Quan trọng: chỉ định role là admin
      
      // Gửi kèm hình ảnh nếu có
      if (currentImages.length > 0) {
        for (let i = 0; i < currentImages.length; i++) {
          formData.append('images', currentImages[i]);
        }
      }

      // Gọi API đến backend
      const response = await axios.post('http://127.0.0.1:8000/api/chatbot/', formData);
      
      // Xử lý phản hồi từ backend
      const responseData = response.data;
      let aiResponseText = '';

      if (responseData.action === "general_chat") {
        aiResponseText = responseData.answer;
      } else if (responseData.success) {
        aiResponseText = responseData.message;
      } else if (!responseData.success) {
        aiResponseText = `❌ ${responseData.error}`;
      } else {
        aiResponseText = "⚠️ Không thể xử lý yêu cầu.";
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: "❌ Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`mb-8 flex gap-4 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'ai' ? 'bg-blue-100' : 'bg-gray-200'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <Sparkles size={16} className="text-blue-600" />
                  ) : (
                    <User size={16} className="text-gray-600" />
                  )}
                </div>

                <div className="flex-1 max-w-2xl">
                  {message.images && message.images.length > 0 && (
                    <div className={`mb-2 flex flex-wrap gap-2 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Uploaded ${index}`}
                          className="max-w-xs rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  <p
                    className={`text-gray-900 leading-relaxed ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles size={16} className="text-blue-600" />
              </div>
              <div className="flex gap-1 items-center">
                {[0, 0.2, 0.4].map((d, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: d }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4">
          {/* Hiển thị ảnh đã chọn */}
          {selectedImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Selected ${index}`}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-3 items-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              multiple
              accept="image/*"
              className="hidden"
            />
            
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendUserMessage();
                }
              }}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="flex-1 px-4 py-3 pr-12 rounded-3xl border border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />

            <button
              onClick={sendUserMessage}
              disabled={!inputValue.trim() && selectedImages.length === 0}
              className="p-3 rounded-full bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}