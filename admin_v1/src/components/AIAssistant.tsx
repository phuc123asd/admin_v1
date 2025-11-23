import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}
const initialMessages: Message[] = [{
  id: 1,
  text: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn quản lý sản phẩm, đơn hàng, và trả lời các câu hỏi về cửa hàng. Bạn cần hỗ trợ gì?',
  sender: 'ai',
  timestamp: new Date()
}];
const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0.3,
      duration: 0.5
    }
  }
};
export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        text: 'Tôi đã hiểu câu hỏi của bạn. Dựa trên dữ liệu hiện tại, tôi có thể giúp bạn phân tích và đưa ra gợi ý tối ưu cho vấn đề này.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };
  return <div className="p-8 h-full flex flex-col">
      <motion.div initial={{
      opacity: 0,
      y: -20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
            <p className="text-slate-600">Quản lý thông minh với Gemini AI</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map(message => <motion.div key={message.id} variants={messageVariants} initial="hidden" animate="show" exit={{
            opacity: 0,
            scale: 0.9
          }} className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.sender === 'ai' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-slate-200'}`}>
                  {message.sender === 'ai' ? <Bot size={20} className="text-white" /> : <User size={20} className="text-slate-600" />}
                </div>
                <div className={`flex-1 max-w-2xl ${message.sender === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-5 py-3 ${message.sender === 'ai' ? 'bg-slate-100 text-slate-900' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-2 ${message.sender === 'ai' ? 'text-slate-500' : 'text-blue-100'}`}>
                      {message.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                    </p>
                  </div>
                </div>
              </motion.div>)}
          </AnimatePresence>

          {isTyping && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <motion.div animate={{
                scale: [1, 1.2, 1]
              }} transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: 0
              }} className="w-2 h-2 bg-slate-400 rounded-full" />
                  <motion.div animate={{
                scale: [1, 1.2, 1]
              }} transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: 0.2
              }} className="w-2 h-2 bg-slate-400 rounded-full" />
                  <motion.div animate={{
                scale: [1, 1.2, 1]
              }} transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: 0.4
              }} className="w-2 h-2 bg-slate-400 rounded-full" />
                </div>
              </div>
            </motion.div>}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Nhập câu hỏi của bạn..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <motion.button whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }} onClick={handleSend} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <Send size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>;
}