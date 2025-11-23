import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Bot, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}
const navItems = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard
}, {
  id: 'products',
  label: 'Sản phẩm',
  icon: Package
}, {
  id: 'orders',
  label: 'Đơn hàng',
  icon: ShoppingCart
}, {
  id: 'ai-assistant',
  label: 'AI Assistant',
  icon: Bot
}];
export function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onToggle
}: SidebarProps) {
  return <>
      {/* Mobile toggle */}
      <button onClick={onToggle} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onToggle} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside initial={false} animate={{
      x: isOpen ? 0 : -280
    }} className="fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col shadow-2xl lg:translate-x-0">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Admin AI
              </h1>
              <p className="text-xs text-slate-400">Powered by Gemini</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return <motion.button key={item.id} onClick={() => {
            onSectionChange(item.id);
            if (window.innerWidth < 1024) onToggle();
          }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`} whileHover={{
            x: 4
          }} whileTap={{
            scale: 0.98
          }}>
                {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl" transition={{
              type: 'spring',
              bounce: 0.2,
              duration: 0.6
            }} />}
                <Icon size={20} className="relative z-10" />
                <span className="relative z-10 font-medium">{item.label}</span>
              </motion.button>;
        })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-400">Gemini AI Admin v1.0</p>
            <p className="text-xs text-slate-500 mt-1">
              Modern Management System
            </p>
          </div>
        </div>
      </motion.aside>
    </>;
}