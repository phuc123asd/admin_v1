import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, CheckCircle, Loader2, ShoppingCart, MapPin, CreditCard, Clock, BadgeCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface OrderItemData {
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface OrderData {
  id: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: string;
  status: string;
  items: OrderItemData[];
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OrderApprovalCard({ isDark, orders, onSuccess }: {
  isDark: boolean;
  orders: OrderData[];
  onSuccess: (count: number) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(orders.map(o => o.id)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o.id)));
  };

  const paymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><BadgeCheck size={11} /> Đã thanh toán</span>;
      case 'failed':
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'}`}><AlertCircle size={11} /> Lỗi thanh toán</span>;
      default:
        return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}><Clock size={11} /> Chờ thanh toán</span>;
    }
  };

  const paymentMethodBadge = (m: string) => {
    if (m === 'momo') return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-700 border-pink-200'}`}><CreditCard size={11} /> MoMo</span>;
    if (m === 'vnpay') return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'}`}><CreditCard size={11} /> VNPay</span>;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${isDark ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-100 text-slate-700 border-slate-300'}`}><CreditCard size={11} /> Nhận hàng COD</span>;
  };

  const formatPrice = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? v : n.toLocaleString('vi-VN') + '₫';
  };

  const handleApprove = async () => {
    if (selected.size === 0) { setError('Vui lòng chọn ít nhất 1 đơn hàng'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      const ids = Array.from(selected);
      fd.append('question', `Duyệt các đơn hàng sau: ${ids.join(', ')}`);
      fd.append('role', 'admin');
      fd.append('is_form_submit', 'true');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/chatbot/`, fd);
      if (res.data.success && res.data.action !== 'show_order_approval') {
        setSubmitted(true);
        onSuccess(ids.length);
      } else {
        setError(res.data.error || 'Duyệt đơn hàng thất bại');
      }
    } catch {
      setError('Kết nối máy chủ thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl p-5 border flex items-center gap-3 ${isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
        <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
        <div>
          <p className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Đã duyệt thành công! 🎉</p>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{selected.size} đơn hàng đã được chuyển sang trạng thái "Đang Vận Chuyển".</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border shadow-xl overflow-hidden active-card-transition ${isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>

      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'bg-white/5' : 'bg-gradient-to-r from-amber-600/10 to-orange-600/10'}`} style={{ borderBottomStyle: 'dashed', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
            <ShoppingCart size={15} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Duyệt đơn hàng ({orders.length})</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Kiểm tra thông tin trước khi xác nhận</p>
          </div>
        </div>
        <button onClick={toggleAll}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${isDark ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-blue-600 hover:bg-blue-50'}`}>
          {selected.size === orders.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>

      {/* Order list */}
      <div className="px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
        {orders.map(order => {
          const isChecked = selected.has(order.id);
          const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

          return (
            <div key={order.id}
              onClick={() => toggle(order.id)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${isChecked
                ? isDark ? 'border-amber-500/60 bg-amber-900/15' : 'border-amber-400 bg-amber-50/60'
                : isDark ? 'border-slate-700 bg-slate-800/50 opacity-60' : 'border-slate-200 bg-slate-50/50 opacity-60'
              }`}>

              {/* Top row: checkbox + customer + total */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? 'border-amber-500 bg-amber-500' : isDark ? 'border-slate-500' : 'border-slate-300'}`}>
                    {isChecked && <Check size={12} className="text-white" />}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{order.customerName}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>#{order.id.slice(-8)} · {order.createdAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold whitespace-nowrap ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>{formatPrice(order.totalPrice)}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{totalItems} sản phẩm</p>
                </div>
              </div>

              {/* Details badges */}
              <div className="mt-3 ml-8 flex flex-wrap gap-2 text-xs">
                {paymentStatusBadge(order.paymentStatus || 'pending')}
                {paymentMethodBadge(order.paymentMethod)}
              </div>

              {/* Items */}
              <div className={`mt-3 ml-8 pt-3 space-y-1.5 text-xs border-t ${isDark ? 'border-slate-700/50 text-slate-300' : 'border-slate-100 text-gray-600'}`}>
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start gap-4">
                    <span className="flex-1 leading-snug">{item.productName} <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>× {item.quantity}</span></span>
                    <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>{formatPrice(item.unitPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Contact row */}
              <div className={`mt-3 ml-8 flex flex-wrap gap-x-4 gap-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1"><MapPin size={11} />{order.shippingAddress}</span>
                <span className="flex items-center gap-1">📱 {order.phone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="px-5 text-sm text-red-500 flex items-center gap-1"><X size={13} />{error}</p>}

      {/* Footer */}
      <div className={`px-5 py-3 flex items-center justify-between border-t ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Đã chọn {selected.size}/{orders.length} đơn</p>
        <button onClick={handleApprove} disabled={isSubmitting || selected.size === 0}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold shadow-md shadow-amber-500/30 hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" />Đang duyệt...</> : <><CheckCircle size={15} />Xác nhận duyệt ({selected.size})</>}
        </button>
      </div>
    </motion.div>
  );
}
