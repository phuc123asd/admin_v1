// src/pages/OrdersPage.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Eye, Package, Truck, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// === Định nghĩa kiểu dữ liệu từ API ===
interface ApiOrderItem {
  product: { id: string; name: string; image: string };
  quantity: number;
  price: number;
}

interface ApiCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface ApiOrder {
  id: string;
  customer: ApiCustomer;
  items: ApiOrderItem[];
  total_price: number;
  status: 'Đang Xử Lý' | 'Đang Vận Chuyển' | 'Đã Giao'; // Chỉ còn 3 trạng thái
  created_at: string;
}

// === Định nghĩa kiểu dữ liệu cho giao diện ===
interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: 'Đang Xử Lý' | 'Đang Vận Chuyển' | 'Đã Giao'; // Chỉ còn 3 trạng thái
  date: string;
}

// === Cấu hình hiển thị cho trạng thái (Đã cập nhật) ===
const statusConfig = {
  'Đang Xử Lý': {
    label: 'Đang xử lý',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Package
  },
  'Đang Vận Chuyển': {
    label: 'Đang vận chuyển',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Truck
  },
  'Đã Giao': {
    label: 'Đã giao',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle
  }
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiOrder[]>(`${import.meta.env.VITE_API_URL}/order/`);
        
        // Chuyển đổi dữ liệu từ API về cấu trúc đơn giản
        const transformedOrders: Order[] = response.data.map((apiOrder) => {
          // Không cần ánh xạ trạng thái nữa, gán trực tiếp
          return {
            id: apiOrder.id,
            customer: `${apiOrder.customer.first_name} ${apiOrder.customer.last_name}`,
            product: apiOrder.items.length > 0 ? apiOrder.items[0].product.name : 'Nhiều sản phẩm',
            amount: apiOrder.total_price,
            status: apiOrder.status, // Gán trực tiếp
            date: new Date(apiOrder.created_at).toLocaleDateString('vi-VN')
          };
        });

        setOrders(transformedOrders);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải đơn hàng:", err);
        setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Logic lọc theo trạng thái và tìm kiếm
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
  };

  // Các lựa chọn cho bộ lọc
  const filterOptions = [
    { key: null, label: 'Tất cả' },
    { key: 'Đang Xử Lý', label: statusConfig['Đang Xử Lý'].label },
    { key: 'Đang Vận Chuyển', label: statusConfig['Đang Vận Chuyển'].label },
    { key: 'Đã Giao', label: statusConfig['Đã Giao'].label }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header và Thanh tìm kiếm */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Đơn hàng</h1>
            <p className="text-gray-600">Quản lý đơn hàng và giao dịch</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm đơn hàng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500" 
          />
        </div>
      </motion.div>

      {/* Loading và Error State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Đang tải đơn hàng...</span>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="ml-2 text-red-500">{error}</p>
        </div>
      )}

      {/* Bảng đơn hàng */}
      {!loading && !error && (
        <>
          {/* Nút lọc trạng thái */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions.map((filter) => (
              <button
                key={filter.key || 'all'}
                onClick={() => handleStatusFilterChange(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (statusFilter === filter.key) || (!statusFilter && filter.key === null)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Mã đơn</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Khách hàng</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Sản phẩm</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Số tiền</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ngày</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => {
                      const status = statusConfig[order.status];
                      const StatusIcon = status.icon;
                      return (
                        <motion.tr 
                          key={order.id} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: index * 0.05 }} 
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4"><span className="font-semibold text-gray-900">{order.id}</span></td>
                          <td className="px-6 py-4"><span className="text-gray-700">{order.customer}</span></td>
                          <td className="px-6 py-4"><span className="text-gray-700">{order.product}</span></td>
                          <td className="px-6 py-4"><span className="font-semibold text-gray-900">₫{order.amount.toLocaleString()}</span></td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${status.color}`}>
                              <StatusIcon size={14} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4"><span className="text-gray-600">{order.date}</span></td>
                          <td className="px-6 py-4">
                            <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" title="Xem chi tiết">
                              <Eye size={18} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {statusFilter ? `Không có đơn hàng nào với trạng thái "${statusFilter}"` : 'Không có đơn hàng nào.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}