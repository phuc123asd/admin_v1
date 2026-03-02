import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Calendar, Eye, EyeOff, Trash2, Reply, Loader, AlertCircle, MessageSquare } from 'lucide-react';
import axios from 'axios';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message?: string;
  created_at: string;
  is_read: boolean;
  reply?: string;
}

interface ContactResponse {
  success: boolean;
  data: Contact[];
  count: number;
}

const CONTACTS_PER_PAGE = 10;

interface ContactPageProps {
  isDark: boolean;
}

export function ContactPage({ isDark }: ContactPageProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ContactResponse>(`${API_URL}/contact/list/`, {
        withCredentials: true,
      });
      setContacts(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải contact:', err);
      setError('Không thể tải dữ liệu contact. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE));
  const startIdx = (currentPage - 1) * CONTACTS_PER_PAGE;
  const endIdx = startIdx + CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIdx, endIdx);

  // Mark as read
  const handleMarkAsRead = async (contact: Contact) => {
    if (contact.is_read) return;
    
    try {
      await axios.patch(`${API_URL}/contact/${contact.id}/update/`, {
        is_read: true
      }, { withCredentials: true });
      
      setContacts(contacts.map(c => 
        c.id === contact.id ? { ...c, is_read: true } : c
      ));
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
    }
  };

  // View detail
  const handleViewDetail = async (contact: Contact) => {
    try {
      const response = await axios.get(`${API_URL}/contact/${contact.id}/`, {
        withCredentials: true,
      });
      setSelectedContact(response.data.data);
      setShowDetailModal(true);
      await handleMarkAsRead(contact);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết:', err);
      alert('Không thể tải chi tiết contact');
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedContact) return;

    setIsReplying(true);
    try {
      const response = await axios.patch(`${API_URL}/contact/${selectedContact.id}/update/`, {
        reply: replyText,
        send_email: sendEmail
      }, { withCredentials: true });

      setSelectedContact(response.data.data);
      setContacts(contacts.map(c => 
        c.id === selectedContact.id ? response.data.data : c
      ));
      setReplyText('');
      alert('Phản hồi đã được gửi!');
    } catch (err) {
      console.error('Lỗi khi gửi phản hồi:', err);
      alert('Không thể gửi phản hồi');
    } finally {
      setIsReplying(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;

    try {
      await axios.delete(`${API_URL}/contact/${contactId}/delete/`, {
        withCredentials: true,
      });
      setContacts(contacts.filter(c => c.id !== contactId));
      setShowDetailModal(false);
      alert('Xóa thành công');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      alert('Không thể xóa contact');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${
      isDark ? 'bg-gradient-to-br from-slate-950 to-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-blue-600 text-white">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Quản Lý Phản Hồi Khách Hàng</h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} mt-1`}>Tổng cộng {contacts.length} tin nhắn</p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            isDark ? 'bg-red-950/30 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <AlertCircle className="text-red-600" />
            <span className={isDark ? 'text-red-300' : 'text-red-800'}>{error}</span>
          </motion.div>
        )}

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, hoặc tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </motion.div>

        {/* Contacts List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {paginatedContacts.length === 0 ? (
            <div className={`text-center py-12 rounded-lg border ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-lg`}>Không có tin nhắn nào</p>
            </div>
          ) : (
            paginatedContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  contact.is_read
                    ? isDark
                      ? 'bg-slate-900 border-slate-700 hover:border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                    : isDark
                      ? 'bg-blue-950/30 border-blue-700 hover:border-blue-500'
                      : 'bg-blue-50 border-blue-300 hover:border-blue-400'
                }`}
                onClick={() => handleViewDetail(contact)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold ${
                        !contact.is_read
                          ? isDark ? 'text-blue-300' : 'text-blue-900'
                          : isDark ? 'text-slate-100' : 'text-gray-900'
                      }`}>
                        {contact.name}
                      </h3>
                      {!contact.is_read && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          Chưa đọc
                        </span>
                      )}
                      {contact.reply && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-green-100 text-green-800'
                        }`}>
                          Đã phản hồi
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <Mail size={16} /> {contact.email}
                    </p>
                    <p className={`font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{contact.subject}</p>
                    <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {contact.message || 'Không có nội dung'}
                    </p>
                    <p className={`text-xs mt-2 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <Calendar size={14} /> {formatDate(contact.created_at)}
                    </p>
                  </div>
                  <div className="ml-4">
                    {contact.is_read ? (
                      <Eye className={isDark ? 'text-slate-500' : 'text-gray-400'} size={20} />
                    ) : (
                      <EyeOff className="text-blue-600" size={20} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'border border-slate-700 hover:bg-slate-800' : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Sau →
            </button>
          </motion.div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedContact && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${
              isDark ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Chi Tiết Tin Nhắn</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`text-2xl ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Tên</label>
                  <p className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{selectedContact.name}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email</label>
                  <p className={isDark ? 'text-slate-200' : 'text-gray-700'}>{selectedContact.email}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Tiêu Đề</label>
                  <p className={isDark ? 'text-slate-200' : 'text-gray-700'}>{selectedContact.subject}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Nội Dung</label>
                  <div className={`mt-2 p-4 rounded-lg border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className={`${isDark ? 'text-slate-200' : 'text-gray-700'} whitespace-pre-wrap`}>{selectedContact.message}</p>
                  </div>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Ngày Gửi</label>
                  <p className={isDark ? 'text-slate-200' : 'text-gray-700'}>{formatDate(selectedContact.created_at)}</p>
                </div>
              </div>

              {/* Reply Section */}
              {selectedContact.reply ? (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800' : 'bg-green-50 border-green-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-emerald-300' : 'text-green-900'}`}>Phản Hồi Từ Admin</h4>
                  <p className={`${isDark ? 'text-emerald-200' : 'text-green-800'} whitespace-pre-wrap`}>{selectedContact.reply}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Gửi Phản Hồi</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập phản hồi..."
                    rows={4}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className={`w-4 h-4 rounded text-blue-600 focus:ring-blue-500 ${
                        isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300'
                      }`}
                    />
                    <label htmlFor="sendEmail" className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Gửi phản hồi qua email cho khách hàng
                    </label>
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isReplying}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReplying ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Reply size={18} />
                        Gửi Phản Hồi
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex gap-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => handleDeleteContact(selectedContact.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={18} />
                Xóa
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  isDark ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
