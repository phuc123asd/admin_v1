// src/pages/UserDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertCircle, 
  Loader, 
  Mail, 
  Phone, 
  MapPin,
  User
} from 'lucide-react';

// Interface cho dữ liệu chi tiết người dùng
interface UserDetail {
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

export function UserDetailPage() {
  // Lấy userId từ tham số URL
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  // State để quản lý dữ liệu người dùng, trạng thái loading và lỗi
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Hàm gọi API để lấy thông tin chi tiết người dùng
  useEffect(() => {
    const fetchUserDetail = async () => {
      // Nếu không có userId, báo lỗi
      if (!userId) {
        setError('ID người dùng không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Gọi API với userId từ URL
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/customer/get_customer/${userId}/`);
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết người dùng:", err);
        setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId]); // Chạy lại effect khi userId thay đổi

  // Hàm quay lại trang danh sách người dùng
  const handleBackToUsers = () => {
    navigate('/users');
  };

  // Giao diện khi đang tải
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Đang tải thông tin người dùng...</span>
      </div>
    );
  }

  // Giao diện khi có lỗi hoặc không tìm thấy người dùng
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy người dùng'}</p>
        <button
          onClick={handleBackToUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Quay lại danh sách người dùng
        </button>
      </div>
    );
  }

  // Giao diện chính hiển thị thông tin người dùng
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Nút quay lại với animation */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-6"
      >
        <button
          onClick={handleBackToUsers}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại danh sách người dùng
        </button>
      </motion.div>

      {/* Thẻ chứa thông tin chi tiết */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        {/* Phần header với avatar và tên */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center">
            {/* Avatar tạo từ chữ cái đầu của tên */}
            <div className="h-24 w-24 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </span>
            </div>
            <div className="ml-6 text-white">
              <h1 className="text-3xl font-bold">{user.first_name} {user.last_name}</h1>
              <div className="flex items-center mt-2 opacity-90">
                <Mail className="w-4 h-4 mr-2" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phần chi tiết thông tin */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cột thông tin liên hệ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Thông tin liên hệ
              </h2>
              <dl className="space-y-4">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Email:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.email}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Điện thoại:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.phone}</dd>
                </div>
              </dl>
            </div>

            {/* Cột địa chỉ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Địa chỉ
              </h2>
              <dl className="space-y-4">
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Địa chỉ:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.address}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Thành phố:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.city}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Tỉnh:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.province}</dd>
                </div>
                <div className="flex">
                  <dt className="text-sm font-medium text-gray-500 w-24">Mã bưu điện:</dt>
                  <dd className="text-sm text-gray-900 flex-1">{user.postal_code}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}