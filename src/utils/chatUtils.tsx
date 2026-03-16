import { Clock, AlertCircle, CreditCard, BadgeCheck } from 'lucide-react';

export const chatUtils = {
  getPaymentStatusBadge: (status: string, isDark: boolean) => {
    switch (status) {
      case 'paid':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
            isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <BadgeCheck size={11} /> Đã thanh toán
          </span>
        );
      case 'failed':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <AlertCircle size={11} /> Lỗi thanh toán
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
            isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <Clock size={11} /> Chờ thanh toán
          </span>
        );
    }
  },

  getPaymentMethodBadge: (method: string, isDark: boolean) => {
    if (method === 'momo') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
          isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-700 border-pink-200'
        }`}>
          <CreditCard size={11} /> MoMo
        </span>
      );
    }
    if (method === 'vnpay') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
          isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <CreditCard size={11} /> VNPay
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${
        isDark ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-100 text-slate-700 border-slate-300'
      }`}>
        <CreditCard size={11} /> Nhận hàng COD
      </span>
    );
  },

  formatPrice: (value: string) => {
    const n = parseFloat(value);
    return isNaN(n) ? value : '$' + n.toLocaleString('en-US');
  },
};
