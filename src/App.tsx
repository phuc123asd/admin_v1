import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { ChatPage } from './components/ChatPage';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { OrdersPage } from './components/OrdersPage';
import { OrderDetailPage } from './components/OrderDetailPage';
import { UsersPage } from './components/UsersPage';
import { UserDetailPage } from './components/UserDetailPage';
import { ContactPage } from './components/ContactPage';

export function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(isDark ? 'dark-theme' : 'light-theme');
    localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <Router>
      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
        <TopNav isDark={isDark} onToggleTheme={() => setIsDark(prev => !prev)} />
        <Routes>
          <Route path="/" element={<ChatPage isDark={isDark} />} />
          <Route path="/chat" element={<ChatPage isDark={isDark} />} />
          <Route path="/contact" element={<ContactPage isDark={isDark} />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}
