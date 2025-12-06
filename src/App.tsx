import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { ChatPage } from './components/ChatPage';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { OrdersPage } from './components/OrdersPage';
import { UsersPage } from './components/UsersPage';
import { UserDetailPage } from './components/UserDetailPage';

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <TopNav />
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}