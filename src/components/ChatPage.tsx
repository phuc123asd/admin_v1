import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Check, Loader2, CreditCard, Package, CheckCircle } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { ChatChart } from './chat/ChatChart';
import { OrderApprovalCard } from './chat/OrderApprovalCard';
import { ProductFormCard } from './chat/ProductFormCard';

import { Message } from '../types/chat';
import { chatService } from '../services/api';

interface ChatPageProps {
  isDark: boolean;
}

export function ChatPage({ isDark }: ChatPageProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addAiMessage = (text: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), text, sender: 'ai', timestamp: new Date() }]);
  };

  const sendUserMessage = async () => {
    if (isSendingRef.current || isTyping) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      const chatHistory = messages
        .filter(m => !m.type || m.type === 'chat')
        .slice(-20)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text } as const));

      const data = await chatService.sendMessage(currentInput, 'admin', chatHistory);

      if (data.action === 'show_order_approval') {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), text: data.answer || 'Kiểm tra đơn hàng bên dưới 👇', sender: 'ai', timestamp: new Date() },
          { id: crypto.randomUUID(), text: '', sender: 'ai', timestamp: new Date(), type: 'order_approval', orderApprovalData: data.orders },
        ]);
      } else if (data.action === 'show_product_form') {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), text: data.answer || 'Điền thông tin sản phẩm vào form bên dưới 👇', sender: 'ai', timestamp: new Date() },
          { id: crypto.randomUUID(), text: '', sender: 'ai', timestamp: new Date(), type: 'product_form', formPrefill: data.prefill },
        ]);
      } else if (data.action === 'draw_chart') {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), text: data.answer || 'Dưới đây là biểu đồ:', sender: 'ai', timestamp: new Date() },
          {
            id: crypto.randomUUID(),
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            type: 'chart',
            chartData: {
              title: data.title || '',
              type: data.type as any || 'line',
              data: data.data || [],
              xAxisKey: data.xAxisKey || '',
              dataKeys: data.dataKeys || []
            }
          },
        ]);
      } else {
        let text = '';
        if (data.action === 'general_chat' || data.action === 'statistics') {
          text = data.answer || '';
        } else if (data.action === 'navigate' && data.payload?.path) {
          text = data.message || `Đang chuyển hướng đến ${data.payload.path}...`;
          setTimeout(() => navigate(data.payload!.path), 1000);
        } else if (data.success) {
          text = data.answer || data.message || `Đã thực thi ${data.action} thành công.`;
        } else {
          text = `${data.error}`;
        }
        addAiMessage(text);
      }
    } catch {
      addAiMessage('❌ Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsTyping(false);
      isSendingRef.current = false;
    }
  };

  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative">
          <div className="flex justify-between items-center bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-2xl">
            <span>{match[1]}</span>
            <button onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), 'code-block')} className="flex items-center gap-1 text-xs hover:text-white">
              {copiedId === 'code-block' ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === 'code-block' ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-b-2xl" {...props}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
      );
    },
    table: ({ children }: any) => <div className="overflow-x-auto my-2 rounded-2xl border border-gray-300"><table className="min-w-full border-collapse">{children}</table></div>,
    th: ({ children }: any) => <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left">{children}</th>,
    td: ({ children }: any) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-gray-700">{children}</blockquote>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 my-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
    li: ({ children }: any) => <li className="my-1">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>,
    a: ({ children, href }: any) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  };

  const renderComposer = (centered: boolean) => (
    <div className={`group/chat relative rounded-full ${centered ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="pointer-events-none absolute -inset-[2px] rounded-full opacity-0 blur-[2px] transition-opacity duration-300 group-focus-within/chat:opacity-100"
        style={{ background: isDark ? 'linear-gradient(120deg,#22d3ee,#38bdf8,#6366f1,#a78bfa,#f472b6)' : 'linear-gradient(120deg,#60a5fa,#2dd4bf,#818cf8,#c084fc,#fb7185)' }} />
      <div className={`rounded-full border px-6 py-4 shadow-sm relative transition-all duration-300 focus-within:shadow-lg outline-none overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900 shadow-slate-950/40 focus-within:border-cyan-500/50'
        : 'border-slate-200 bg-white shadow-slate-200/70 focus-within:border-blue-400 focus-within:shadow-blue-400/30'}`}>
        <div className="flex items-center gap-3">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (e.repeat) return;
                const n = e.nativeEvent as KeyboardEvent;
                if (n.isComposing || n.keyCode === 229) return;
                e.preventDefault();
                sendUserMessage();
              }
            }}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className={`w-full py-1 text-xl font-light bg-transparent appearance-none resize-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-950 placeholder:text-gray-400'}`}
            style={{ minHeight: '32px', maxHeight: '200px', border: 'none', outline: 'none', boxShadow: 'none' }}
          />
          <button onClick={sendUserMessage} disabled={isTyping || !inputValue.trim()}
            className={`p-2.5 rounded-full shadow-md transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed
              ${isDark 
                ? 'bg-white text-slate-950 hover:bg-slate-100 keep-light' 
                : 'bg-slate-950 text-white hover:bg-slate-900'}`}
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative flex flex-col h-[calc(100vh-4rem)] transition-colors duration-500 ${isDark ? 'bg-[#020617]' : 'bg-gradient-to-b from-slate-100 via-slate-100 to-blue-50'}`}>
      {isDark && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(2,6,23,1)_100%)] pointer-events-none" />
      )}
      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {hasMessages ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <AnimatePresence>
                {messages.map((message, idx) => {
                  const prevMsg = messages[idx - 1];
                  const showDivider = message.sender === 'ai' && message.type !== 'product_form' && prevMsg?.sender === 'user';

                  return (
                    <React.Fragment key={message.id}>
                      {showDivider && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className={`my-5 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'}`}
                        />
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`mb-8 ${message.sender === 'user' ? 'flex justify-end' : 'w-full'}`}
                      >
                        {message.type === 'order_approval' && message.orderApprovalData ? (
                          <div className="w-full max-w-2xl">
                            <OrderApprovalCard isDark={isDark} orders={message.orderApprovalData}
                              onSuccess={count => addAiMessage(`✅ Đã duyệt thành công **${count} đơn hàng**! Trạng thái đã chuyển sang "Đang Vận Chuyển".`)} />
                          </div>
                        ) : message.type === 'product_form' ? (
                          <div className="w-full max-w-2xl">
                            <ProductFormCard isDark={isDark} prefill={message.formPrefill}
                              onSuccess={name => addAiMessage(`✅ Sản phẩm **"${name}"** đã được ${message.formPrefill?.id ? 'cập nhật' : 'tạo'} thành công và đã xuất hiện trong danh sách sản phẩm!`)} />
                          </div>
                        ) : message.type === 'chart' && message.chartData ? (
                          <div className="w-full max-w-3xl">
                            <ChatChart data={message.chartData} isDark={isDark} />
                            {message.text && (
                              <div className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                <ReactMarkdown components={MarkdownComponents}>{message.text}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        ) : message.sender === 'user' ? (
                          <div className="flex flex-col items-end max-w-[70%]">
                            <div className={`px-6 py-4 rounded-3xl text-base font-light leading-relaxed ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-950'
                              }`}>
                              {message.text}
                            </div>
                            <span className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full group/msg relative">
                            <div className={`prose prose-base max-w-none leading-relaxed font-light transition-colors duration-300 ${isDark ? 'prose-invert text-slate-100' : 'text-slate-950'
                              }`}>
                              <ReactMarkdown components={MarkdownComponents}>{message.text}</ReactMarkdown>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button onClick={() => copyToClipboard(message.text, message.id)}
                                className={`p-1 rounded-lg opacity-0 group-hover/msg:opacity-100 transition-opacity ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-gray-400'
                                  }`}>
                                {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 w-full">
                  <div className={`my-5 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'}`} />
                  <div className="flex gap-1.5 items-center py-2">
                    {[0, 0.18, 0.36].map((d, i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d, ease: 'easeInOut' }}
                        className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-indigo-400'
                          }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="max-w-4xl mx-auto">{renderComposer(false)}</div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-12">
              <h1 className={`text-6xl md:text-7xl font-light tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Xin chào Phuc!
              </h1>
              <p className={`text-xl md:text-2xl font-light ${isDark ? 'text-white' : 'text-slate-950'}`}>
                Chúng ta nên bắt đầu từ đâu nhỉ?
              </p>
            </div>

            <div className="mb-8">
              {renderComposer(true)}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: <Package size={16} />, label: "Thêm sản phẩm", prompt: "Tôi muốn thêm sản phẩm mới" },
                { icon: <CheckCircle size={16} />, label: "Duyệt đơn hàng", prompt: "Duyệt các đơn hàng mới nhất" },
                { icon: <CreditCard size={16} />, label: "Xem báo cáo", prompt: "Vẽ biểu đồ doanh thu tuần này" },
                { icon: <Package size={16} />, label: "Cập sửa đơn hàng", prompt: "Tôi muốn sửa thông tin đơn hàng" }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(item.prompt)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full border text-base font-light transition-all shadow-sm
                    ${isDark
                      ? 'bg-slate-900/40 border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700 hover:text-white'
                      : 'bg-white border-slate-200 text-gray-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
