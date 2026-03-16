import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MessageSquare, Package, ShoppingCart, Users, Mail, Sun, Moon } from 'lucide-react';

interface TopNavProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function TopNav({ isDark, onToggleTheme }: TopNavProps) {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.startsWith('/products')) return 'products';
    if (location.pathname.startsWith('/users')) return 'users';
    if (location.pathname.startsWith('/orders')) return 'orders';
    if (location.pathname.startsWith('/contact')) return 'contact';
    return 'chat';
  };
  
  const activeSection = getActiveSection();

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className={`text-xl font-light ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Admin Dashboard</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/chat"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeSection === 'chat'
                    ? `border-blue-500 ${isDark ? 'text-slate-100' : 'text-gray-900'}`
                    : `${isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Link>
              <Link
                to="/products"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeSection === 'products'
                    ? `border-blue-500 ${isDark ? 'text-slate-100' : 'text-gray-900'}`
                    : `${isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <Package className="w-4 h-4 mr-2" />
                Products
              </Link>
              <Link
                to="/orders"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeSection === 'orders'
                    ? `border-blue-500 ${isDark ? 'text-slate-100' : 'text-gray-900'}`
                    : `${isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Orders
              </Link>
              <Link
                to="/users"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeSection === 'users'
                    ? `border-blue-500 ${isDark ? 'text-slate-100' : 'text-gray-900'}`
                    : `${isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Link>
              <Link
                to="/contact"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeSection === 'contact'
                    ? `border-blue-500 ${isDark ? 'text-slate-100' : 'text-gray-900'}`
                    : `${isDark ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Phản Hồi
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-yellow-300 hover:bg-slate-700'
                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-100'
              }`}
              title={isDark ? 'Chuyển sáng' : 'Chuyển tối'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
