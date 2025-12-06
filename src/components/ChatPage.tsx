import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Paperclip, Copy, Check } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      formData.append('role', 'admin');
      
      // Gửi kèm hình ảnh nếu có
      if (currentImages.length > 0) {
        for (let i = 0; i < currentImages.length; i++) {
          formData.append('images', currentImages[i]);
        }
      }

      // Gọi API đến backend
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/chatbot/`, formData);
      
      // Xử lý phản hồi từ backend
      const responseData = response.data;
      let aiResponseText = '';

      if (responseData.action === "general_chat") {
        aiResponseText = responseData.answer;
      } 
      else if(responseData.action === "statistics") {
        aiResponseText = responseData.answer;
      }
      else if (responseData.success) {
        aiResponseText = responseData.message;
      } else if (!responseData.success) {
        aiResponseText = `${responseData.error}`;
      } else {
        aiResponseText = "Không thể xử lý yêu cầu.";
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

  // Custom components for markdown rendering
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative">
          <div className="flex justify-between items-center bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-md">
            <span>{match[1]}</span>
            <button
              onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), 'code-block')}
              className="flex items-center gap-1 text-xs hover:text-white"
            >
              {copiedId === 'code-block' ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === 'code-block' ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            className="rounded-b-md"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full border-collapse border border-gray-300">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="border border-gray-300 px-4 py-2">
          {children}
        </td>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-gray-700">
          {children}
        </blockquote>
      );
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-5 my-2">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 my-2">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="my-1">{children}</li>;
    },
    h1({ children }: any) {
      return <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>;
    },
    a({ children, href }: any) {
      return (
        <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`mb-6 flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'ai' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md' : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-md'
                  }`}
                >
                  {message.sender === 'ai' ? (
                    <Sparkles size={18} className="text-white" />
                  ) : (
                    <User size={18} className="text-white" />
                  )}
                </div>

                <div className={`flex-1 max-w-3xl ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                  {message.images && message.images.length > 0 && (
                    <div className={`mb-2 flex flex-wrap gap-2 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Uploaded ${index}`}
                          className="max-w-xs rounded-lg shadow-md"
                        />
                      ))}
                    </div>
                  )}
                  <div
                    className={`relative px-5 py-4 rounded-2xl shadow-sm ${
                      message.sender === 'ai'
                        ? "bg-white border border-gray-200 text-gray-800"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown components={MarkdownComponents}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                    {message.sender === 'ai' && (
                      <button
                        onClick={() => copyToClipboard(message.text, message.id)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-500 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Copy message"
                      >
                        {copiedId === message.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
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
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Hiển thị ảnh đã chọn */}
          {selectedImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Selected ${index}`}
                    className="h-16 w-16 object-cover rounded-lg shadow-sm"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
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
              className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
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
              className="flex-1 px-4 py-3 pr-12 rounded-3xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />

            <button
              onClick={sendUserMessage}
              disabled={!inputValue.trim() && selectedImages.length === 0}
              className="p-3 rounded-full bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}