import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader, Package, CreditCard, MapPin, User } from 'lucide-react';

interface ApiOrderProduct {
  id: string;
  name: string;
  image: string;
}

interface ApiOrderItem {
  product: string | ApiOrderProduct;
  quantity: number;
  price: number;
}

interface ApiCustomer {
  id: string;
  _id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface ApiOrder {
  id: string;
  customer: ApiCustomer | string;
  items: ApiOrderItem[];
  total_price: number;
  status: 'Đang Xử Lý' | 'Đang Vận Chuyển' | 'Đã Giao';
  payment_status?: 'pending' | 'paid' | 'failed';
  payment_method?: 'cod' | 'momo' | 'vnpay';
  shipping_address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  'Đang Xử Lý': {
    label: 'Đang xử lý',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'Đang Vận Chuyển': {
    label: 'Đang vận chuyển',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'Đã Giao': {
    label: 'Đã giao',
    color: 'bg-green-50 text-green-700 border-green-200'
  }
};

function paymentStatusBadge(paymentStatus: 'pending' | 'paid' | 'failed' = 'pending') {
  switch (paymentStatus) {
    case 'paid':
      return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Đã thanh toán</span>;
    case 'failed':
      return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Thất bại</span>;
    default:
      return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Chưa thanh toán</span>;
  }
}

function paymentMethodLabel(method: 'cod' | 'momo' | 'vnpay' = 'cod') {
  switch (method) {
    case 'momo':
      return 'MoMo';
    case 'vnpay':
      return 'VNPAY';
    default:
      return 'COD';
  }
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [customerProfile, setCustomerProfile] = useState<ApiCustomer | null>(null);
  const [productPreviewMap, setProductPreviewMap] = useState<Record<string, ApiOrderProduct>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedCustomerId = useMemo(() => {
    if (!order?.customer) return '';
    if (typeof order.customer === 'string') return order.customer;
    return order.customer.id || order.customer._id || '';
  }, [order]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiOrder>(`${import.meta.env.VITE_API_URL}/order/${orderId}/`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err);
        setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      const customerId = resolvedCustomerId;
      if (!customerId) return;

      try {
        const response = await axios.get<ApiCustomer>(
          `${import.meta.env.VITE_API_URL}/customer/get_customer/${customerId}/`
        );
        setCustomerProfile(response.data);
      } catch (err) {
        console.error('Lỗi khi tải thông tin khách hàng:', err);
        setCustomerProfile(null);
      }
    };

    fetchCustomerProfile();
  }, [resolvedCustomerId]);

  useEffect(() => {
    const fetchProductPreviews = async () => {
      if (!order || !order.items.length) return;

      const productIds = Array.from(
        new Set(
          order.items
            .map((item) => (typeof item.product === 'string' ? item.product : item.product.id))
            .filter(Boolean)
        )
      );

      if (!productIds.length) return;

      try {
        const responses = await Promise.all(
          productIds.map(async (productId) => {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/${productId}/`);
            const data = response.data || {};
            return {
              id: String(data.id || productId),
              name: data.name || `Sản phẩm ${productId}`,
              image: data.image || '',
            } as ApiOrderProduct;
          })
        );

        const nextMap: Record<string, ApiOrderProduct> = {};
        responses.forEach((item) => {
          nextMap[item.id] = item;
        });
        setProductPreviewMap(nextMap);
      } catch (err) {
        console.error('Lỗi khi tải preview sản phẩm:', err);
      }
    };

    fetchProductPreviews();
  }, [order]);

  const customerName = useMemo(() => {
    const orderCustomer = typeof order?.customer === 'string' ? null : order?.customer;
    const source = customerProfile || orderCustomer;
    if (!source) return 'Không xác định';
    const fullName = `${source.first_name || ''} ${source.last_name || ''}`.trim();
    return fullName || source.email || source.id || source._id || 'Không xác định';
  }, [customerProfile, order]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-center items-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Đang tải chi tiết đơn hàng...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách đơn hàng
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
          <AlertCircle size={22} />
          <span>{error || 'Không tìm thấy đơn hàng.'}</span>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách đơn hàng
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Chi tiết đơn hàng</h1>
            <p className="text-gray-600">Mã đơn: <span className="font-medium text-gray-900">{order.id}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${status.color}`}>
              <Package size={14} />
              {status.label}
            </span>
            {paymentStatusBadge(order.payment_status)}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sản phẩm trong đơn</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={`${typeof item.product === 'string' ? item.product : item.product.id}-${item.price}`} className="px-6 py-4 flex gap-4">
                {(() => {
                  const productId = typeof item.product === 'string' ? item.product : item.product.id;
                  const preview = productPreviewMap[productId];
                  const imageUrl =
                    preview?.image ||
                    (typeof item.product === 'string' ? '' : item.product.image) ||
                    'https://placehold.co/96x96?text=No+Image';
                  const productName =
                    preview?.name ||
                    (typeof item.product === 'string' ? `Sản phẩm ${productId}` : item.product.name);

                  return (
                    <>
                <img
                  src={imageUrl}
                  alt={productName}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-200 bg-gray-50"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {productName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Mã SP: {productId}
                  </p>
                  <div className="mt-2 text-sm text-gray-700">
                    <span>Số lượng: <strong>{item.quantity}</strong></span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span>Đơn giá: <strong>₫{item.price.toLocaleString()}</strong></span>
                  </div>
                </div>
                    </>
                  );
                })()}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Thành tiền</p>
                  <p className="font-semibold text-gray-900">₫{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600">Tổng thanh toán</p>
              <p className="text-2xl font-bold text-gray-900">₫{order.total_price.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={18} />
              Khách hàng
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Họ tên:</span> <span className="font-medium text-gray-900">{customerName}</span></p>
              <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{customerProfile?.email || (typeof order.customer === 'string' ? '' : (order.customer?.email || '')) || 'N/A'}</span></p>
              <p><span className="text-gray-500">Điện thoại:</span> <span className="text-gray-900">{customerProfile?.phone || order.phone || (typeof order.customer === 'string' ? '' : (order.customer?.phone || '')) || 'N/A'}</span></p>
              <p><span className="text-gray-500">Mã KH:</span> <span className="text-gray-900">{customerProfile?.id || customerProfile?._id || resolvedCustomerId || 'N/A'}</span></p>
              {(customerProfile?.id || customerProfile?._id || resolvedCustomerId) && (
                <Link
                  to={`/users/${customerProfile?.id || customerProfile?._id || resolvedCustomerId}`}
                  className="inline-flex items-center px-3 py-1.5 mt-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Xem trang người dùng
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={18} />
              Giao hàng
            </h3>
            <div className="space-y-2 text-sm text-gray-900">
              <p>{order.shipping_address || 'N/A'}</p>
              <p>{[order.city, order.province].filter(Boolean).join(', ') || 'N/A'}</p>
              <p>Mã bưu chính: {order.postal_code || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} />
              Thanh toán
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Phương thức:</span> <span className="font-medium text-gray-900">{paymentMethodLabel(order.payment_method)}</span></p>
              <p><span className="text-gray-500">Trạng thái:</span> <span className="text-gray-900 ml-1">{paymentStatusBadge(order.payment_status)}</span></p>
              <p><span className="text-gray-500">Ngày tạo:</span> <span className="text-gray-900">{new Date(order.created_at).toLocaleString('vi-VN')}</span></p>
              <p><span className="text-gray-500">Cập nhật:</span> <span className="text-gray-900">{new Date(order.updated_at).toLocaleString('vi-VN')}</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
