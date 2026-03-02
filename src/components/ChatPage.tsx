import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Copy, Check, Paperclip } from 'lucide-react';
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

const initialMessages: Message[] = [];

interface ChatPageProps {
  isDark: boolean;
}

export function ChatPage({ isDark }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSendingRef = useRef(false);
  const lastSentRef = useRef<{ text: string; time: number } | null>(null);
  const hasMessages = messages.length > 0;

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendUserMessage = async () => {
    if (isSendingRef.current || isTyping) return;
    if (!inputValue.trim() && selectedImages.length === 0) return;
    const normalized = inputValue.trim().replace(/\s+/g, ' ');
    const now = Date.now();
    if (
      selectedImages.length === 0 &&
      lastSentRef.current &&
      lastSentRef.current.text === normalized &&
      now - lastSentRef.current.time < 900
    ) {
      return;
    }
    isSendingRef.current = true;
    if (selectedImages.length === 0) {
      lastSentRef.current = { text: normalized, time: now };
    }

    const imageUrls = selectedImages.map(img => URL.createObjectURL(img));

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
      isSendingRef.current = false;
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

  const renderComposer = (centered: boolean) => (
    <div className={`group/chat relative ${centered ? 'max-w-4xl mx-auto' : ''}`}>
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-3xl opacity-0 blur-[2px] transition-opacity duration-300 group-focus-within/chat:opacity-100"
        style={{
          background: isDark
            ? 'linear-gradient(120deg, #22d3ee 0%, #38bdf8 25%, #6366f1 50%, #a78bfa 75%, #f472b6 100%)'
            : 'linear-gradient(120deg, #60a5fa 0%, #2dd4bf 25%, #818cf8 50%, #c084fc 75%, #fb7185 100%)'
        }}
      />
      <div className={`rounded-3xl border px-5 py-4 shadow-sm relative transition-all duration-300 focus-within:shadow-lg ${
        isDark
          ? 'border-slate-700 bg-slate-900 shadow-slate-950/40 focus-within:border-cyan-300 focus-within:shadow-cyan-500/20'
          : 'border-slate-200 bg-white shadow-slate-200/70 focus-within:border-blue-400 focus-within:shadow-blue-400/30'
      }`}>
      <textarea
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            if (e.repeat) return;
            const native = e.nativeEvent as KeyboardEvent;
            if (native.isComposing || native.keyCode === 229) return;
            e.preventDefault();
            sendUserMessage();
          }
        }}
        placeholder="Nhập tin nhắn..."
        rows={1}
        className={`chat-composer-input w-full px-1 py-1 text-lg bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:border-0 shadow-none resize-none ${
          isDark ? 'text-slate-100 placeholder:text-slate-400' : 'text-gray-800 placeholder:text-gray-500'
        }`}
        style={{ minHeight: '44px', maxHeight: '200px' }}
      />

      <div className="flex justify-between items-end">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-full transition-colors shadow-sm ${
            isDark
              ? 'bg-gradient-to-br from-slate-700 to-slate-600 text-sky-300 hover:from-slate-600 hover:to-slate-500'
              : 'bg-gradient-to-br from-sky-100 to-blue-100 text-blue-600 hover:from-sky-200 hover:to-blue-200'
          }`}
          title="Thêm tệp"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          multiple
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={sendUserMessage}
          disabled={isTyping || (!inputValue.trim() && selectedImages.length === 0)}
          className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-md shadow-blue-300/50"
        >
          <Send size={18} />
        </button>
      </div>
      </div>
    </div>
  );

  return (
    <div className={`relative flex flex-col h-[calc(100vh-4rem)] ${
      isDark
        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900'
        : 'bg-gradient-to-b from-slate-100 via-slate-100 to-blue-50'
    }`}>
      {hasMessages ? (
        <>
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
                              ? isDark
                                ? "bg-slate-900 border border-slate-700 text-slate-100"
                                : "bg-white border border-slate-200 text-gray-800"
                              : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                          }`}
                        >
                          <div className={`prose prose-sm max-w-none ${isDark && message.sender === 'ai' ? 'prose-invert' : ''}`}>
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
                        <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'} ${
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
                    <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                      isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex gap-1 items-center">
                        {[0, 0.2, 0.4].map((d, idx) => (
                          <motion.div
                            key={idx}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: d }}
                            className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-400' : 'bg-gray-400'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

          <div className="px-6 py-4">
            <div className="max-w-4xl mx-auto">
              {renderComposer(false)}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl">
            <div className="mb-8">
              <p className="text-4xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 leading-tight">Xin chào Phuc!</p>
              <p className={`text-4xl md:text-5xl font-semibold leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Chúng ta nên bắt đầu từ đâu nhỉ?</p>
            </div>
            {renderComposer(true)}
          </div>
        </div>
      )}
    </div>
  );
}
