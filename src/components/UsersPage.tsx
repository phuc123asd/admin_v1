// src/pages/UsersPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader, Users, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

// Interface cho dữ liệu người dùng
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

// Interface cho phản hồi từ API
interface UsersResponse {
  customers: User[];
  count: number;
}

const USERS_PER_PAGE = 9;

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Lấy dữ liệu người dùng từ API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Sử dụng axios thay cho fetch
      const response = await axios.get<UsersResponse>(`${import.meta.env.VITE_API_URL}/customer/get_all/`, {
        withCredentials: true, // Tương đương với credentials: 'include'
      });

      setUsers(response.data.customers);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải người dùng:', err);
      setError('Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Lấy người dùng khi component được mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = (userId: string) => {
    // Điều hướng đến trang chi tiết người dùng (nếu có)
    navigate(`/users/${userId}`);
  };

  // Lọc người dùng để hiển thị
  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hiển thị trạng thái Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Đang tải người dùng...</span>
        </div>
      )}

      {/* Hiển thị trạng thái Lỗi */}
      {error && (
        <div className="flex justify-center items-center py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="ml-2 text-red-500">{error}</p>
        </div>
      )}

      {/* Hiển thị danh sách người dùng */}
      {!loading && !error && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Người dùng</h1>
              <p className="text-gray-600">Quản lý tài khoản khách hàng</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </motion.div>

          {filteredUsers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="p-5">
                    {/* Avatar và Tên */}
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-full">
                        <span className="text-indigo-800 font-medium text-lg">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h3>
                      </div>
                    </div>

                    {/* Email và Điện thoại */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <div>
                        <div>{user.address}</div>
                        <div>{user.city}, {user.province}</div>
                        <div>{user.postal_code}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                    Trước
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    Trang {currentPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {users.length > 0 ? 'Không tìm thấy người dùng' : 'Không có người dùng nào'}
              </h3>
              <p className="text-gray-600">
                {users.length > 0 ? 'Thử từ khóa khác để tìm kiếm.' : 'Chưa có tài khoản nào được tạo.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
