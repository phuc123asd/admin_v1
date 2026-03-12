import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Check, Package, X, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProductFormData {
  id?: string;
  name: string;
  price: string;
  originalPrice: string;
  category: string;
  brand: string;
  description: string;
  features: string[];
  specifications: { key: string; value: string }[];
  isNew: boolean;
  inStock: boolean;
  mainImage?: string;
  galleryImages?: string[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
  type?: 'chat' | 'product_form';
  formPrefill?: Partial<ProductFormData>;
}

interface ChatPageProps {
  isDark: boolean;
}

// ─── Product Form Card ────────────────────────────────────────────────────────
function ProductFormCard({ isDark, prefill, onSuccess }: {
  isDark: boolean;
  prefill?: Partial<ProductFormData>;
  onSuccess: (productName: string) => void;
}) {
  // Normalize specifications from Object (AI format) to Array (Form format)
  const normalizedSpecs = prefill?.specifications
    ? Object.entries(prefill.specifications).map(([key, value]) => ({ key, value: String(value) }))
    : [{ key: '', value: '' }];

  const [form, setForm] = useState<ProductFormData>({
    id: prefill?.id,
    name: String(prefill?.name ?? ''),
    price: String(prefill?.price ?? ''),
    originalPrice: String(prefill?.originalPrice ?? ''),
    category: String(prefill?.category ?? ''),
    brand: String(prefill?.brand ?? ''),
    description: String(prefill?.description ?? ''),
    features: Array.isArray(prefill?.features) ? prefill.features : [''],
    specifications: normalizedSpecs,
    isNew: prefill?.isNew ?? false,
    inStock: prefill?.inStock ?? true,
    mainImage: prefill?.mainImage ?? '',
    galleryImages: prefill?.galleryImages ?? [],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Categories & Brands fetching
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/categories/`),
      axios.get(`${import.meta.env.VITE_API_URL}/brand/`),
    ])
      .then(([catRes, brandRes]) => {
        setCategories(catRes.data);
        setBrands(brandRes.data);
      })
      .catch(() => {
        // Silently fail, user can reload or use default
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  const set = (field: keyof ProductFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Features
  const updateFeature = (idx: number, val: string) => {
    const f = [...form.features]; f[idx] = val; set('features', f);
  };
  const addFeature = () => set('features', [...form.features, '']);
  const removeFeature = (idx: number) => set('features', form.features.filter((_, i) => i !== idx));

  // Specs
  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    const s = [...form.specifications]; s[idx] = { ...s[idx], [field]: val }; set('specifications', s);
  };
  const addSpec = () => set('specifications', [...form.specifications, { key: '', value: '' }]);
  const removeSpec = (idx: number) => set('specifications', form.specifications.filter((_, i) => i !== idx));

  // Images
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    files.forEach(f => setImagePreviews(prev => [...prev, URL.createObjectURL(f)]));
  };
  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên sản phẩm'); return; }
    if (!form.price) { setError('Vui lòng nhập giá bán'); return; }
    if (!form.category.trim()) { setError('Vui lòng nhập danh mục'); return; }
    if (!form.brand.trim()) { setError('Vui lòng nhập thương hiệu'); return; }

    const isUpdate = !!form.id;
    if (!isUpdate && imageFiles.length === 0) {
      setError('Vui lòng thêm ít nhất 1 ảnh sản phẩm'); return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      const featuresStr = form.features.filter(f => f.trim()).join(', ');
      const specsStr = form.specifications.filter(s => s.key.trim()).map(s => `${s.key}: ${s.value}`).join(', ');

      let question = '';
      const keptImagesStr = [];
      if (form.mainImage) keptImagesStr.push(form.mainImage);
      if (form.galleryImages && form.galleryImages.length > 0) keptImagesStr.push(...form.galleryImages);

      if (isUpdate) {
        question = `Cập nhật sản phẩm (ID: ${form.id}): tên="${form.name}", giá=${form.price}, giá gốc=${form.originalPrice || form.price}, danh mục="${form.category}", thương hiệu="${form.brand}", mô tả="${form.description}", tính năng="${featuresStr}", thông số="${specsStr}", sản phẩm mới=${form.isNew}, còn hàng=${form.inStock}. (Giữ lại các ảnh cũ: ${keptImagesStr.join(', ')})`;
      } else {
        question = `Thêm sản phẩm: tên="${form.name}", giá=${form.price}, giá gốc=${form.originalPrice || form.price}, danh mục="${form.category}", thương hiệu="${form.brand}", mô tả="${form.description}", tính năng="${featuresStr}", thông số="${specsStr}", sản phẩm mới=${form.isNew}, còn hàng=${form.inStock}`;
      }

      fd.append('question', question);
      fd.append('role', 'admin');
      fd.append('is_form_submit', 'true');
      imageFiles.forEach(f => fd.append('images', f));
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/chatbot/`, fd);
      const data = res.data;
      if (data.success && data.action !== 'show_product_form') {
        setSubmitted(true);
        onSuccess(form.name);
      } else {
        setError(data.error || (isUpdate ? 'Cập nhật sản phẩm thất bại' : 'Tạo sản phẩm thất bại'));
      }
    } catch {
      setError('Kết nối máy chủ thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inp = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${isDark
    ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:ring-cyan-500/40 focus:border-cyan-500'
    : 'bg-white border-slate-200 text-gray-800 placeholder:text-gray-400 focus:ring-blue-400/40 focus:border-blue-400'
    }`;
  const lbl = `text-xs font-medium mb-1 block ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl p-5 border flex items-center gap-3 ${isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
        <CheckCircle size={24} className="text-emerald-500 flex-shrink-0" />
        <div>
          <p className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Sản phẩm đã được {form.id ? 'cập nhật' : 'tạo'} thành công! 🎉</p>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>"{form.name}" đã được {form.id ? 'cập nhật' : 'thêm'} vào cơ sở dữ liệu.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border shadow-lg overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-2 border-b bg-gradient-to-r from-blue-600/10 to-violet-600/10" style={{ borderBottomStyle: 'dashed', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
          <Package size={15} className="text-white" />
        </div>
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'} [Dropdown V1]</p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Điền đầy đủ thông tin và bấm {form.id ? 'Cập nhật' : 'Tạo'} sản phẩm</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Tên & Danh mục */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Tên sản phẩm <span className="text-red-400">*</span></label>
            <input className={inp} placeholder="VD: iPhone 16 Pro Max" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Danh mục <span className="text-red-400">*</span></label>
            <select
              className={inp}
              value={form.category}
              onChange={e => set('category', e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Đang tải...' : '-- Chọn danh mục --'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Giá bán / Giá gốc / Thương hiệu */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lbl}>Giá bán (₫) <span className="text-red-400">*</span></label>
            <input type="number" className={inp} placeholder="29990000" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Giá gốc (₫)</label>
            <input type="number" className={inp} placeholder="34990000" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Thương hiệu <span className="text-red-400">*</span></label>
            <select
              className={inp}
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Đang tải...' : '-- Chọn thương hiệu --'}</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className={lbl}>Mô tả sản phẩm</label>
          <textarea className={`${inp} resize-none`} rows={2} placeholder="Mô tả ngắn hấp dẫn về sản phẩm..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Tính năng nổi bật */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={lbl + ' !mb-0'}>Tính năng nổi bật</label>
            <button onClick={addFeature} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${isDark ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-blue-600 hover:bg-blue-50'}`}>
              <Plus size={12} /> Thêm
            </button>
          </div>
          <div className="space-y-2">
            {form.features.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={inp} placeholder={`Tính năng ${i + 1} (VD: Chip A17 Pro)`} value={f} onChange={e => updateFeature(i, e.target.value)} />
                {form.features.length > 1 && (
                  <button onClick={() => removeFeature(i)} className="flex-shrink-0 text-red-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Thông số kỹ thuật */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={lbl + ' !mb-0'}>Thông số kỹ thuật</label>
            <button onClick={addSpec} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${isDark ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-blue-600 hover:bg-blue-50'}`}>
              <Plus size={12} /> Thêm
            </button>
          </div>
          <div className="space-y-2">
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={inp} placeholder="Tên thông số (VD: Màn hình)" value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} />
                <span className={`flex-shrink-0 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>:</span>
                <input className={inp} placeholder="Giá trị (VD: 6.1 inch OLED)" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} />
                {form.specifications.length > 1 && (
                  <button onClick={() => removeSpec(i)} className="flex-shrink-0 text-red-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Toggle: inStock & isNew */}
        <div className="flex gap-3 flex-wrap">
          {/* inStock */}
          <button onClick={() => set('inStock', !form.inStock)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.inStock
              ? isDark ? 'border-emerald-600 bg-emerald-900/30 text-emerald-300' : 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : isDark ? 'border-slate-600 bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 text-gray-400'
              }`}>
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.inStock ? 'border-emerald-500 bg-emerald-500' : isDark ? 'border-slate-500' : 'border-slate-300'}`}>
              {form.inStock && <Check size={10} className="text-white" />}
            </span>
            Còn hàng
          </button>
          {/* isNew */}
          <button onClick={() => set('isNew', !form.isNew)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.isNew
              ? isDark ? 'border-violet-600 bg-violet-900/30 text-violet-300' : 'border-violet-400 bg-violet-50 text-violet-700'
              : isDark ? 'border-slate-600 bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-50 text-gray-400'
              }`}>
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.isNew ? 'border-violet-500 bg-violet-500' : isDark ? 'border-slate-500' : 'border-slate-300'}`}>
              {form.isNew && <Check size={10} className="text-white" />}
            </span>
            Sản phẩm mới
          </button>
        </div>

        {/* Upload ảnh */}
        <div>
          <label className={lbl}>Hình ảnh sản phẩm {!form.id && <span className="text-red-400">*</span>}</label>
          <div className="flex flex-col gap-4">
            
            {/* Ảnh đại diện (Main Image) */}
            {form.mainImage && (
              <div>
                <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>Ảnh đại diện hiện tại:</p>
                <div className="relative group inline-block">
                  <img src={form.mainImage} alt="Main" className="w-20 h-20 rounded-xl object-cover border-2 border-indigo-400/50 shadow-sm" />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white text-center p-1 cursor-pointer"
                       onClick={() => set('mainImage', '')}>
                    <Trash2 size={14} className="mb-1 text-red-400" />
                    <span>Xoá ảnh</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ảnh thư viện (Gallery Images) */}
            {form.galleryImages && form.galleryImages.length > 0 && (
              <div>
                 <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>Ảnh thư viện hiện tại:</p>
                 <div className="flex flex-wrap gap-2">
                    {form.galleryImages.map((src: string, i: number) => (
                      <div key={`gallery-${i}`} className="relative group inline-block">
                        <img src={src} alt="Gallery" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white text-center p-1 cursor-pointer"
                             onClick={() => set('galleryImages', form.galleryImages?.filter((_, index) => index !== i))}>
                           <Trash2 size={12} className="mb-1 text-red-400" />
                           <span>Xoá ảnh</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Thêm ảnh mới */}
            <div>
              <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ảnh mới thêm (sẽ được tải lên):</p>
              <div className="flex flex-wrap gap-2 items-start">
                {imagePreviews.map((src: string, i: number) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
                    <button onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <button onClick={() => imgInputRef.current?.click()}
                  className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isDark ? 'border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400' : 'border-slate-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
                    }`}>
                  <Plus size={16} />
                  <span>Thêm ảnh</span>
                </button>
                <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 flex items-center gap-1"><X size={13} /> {error}</p>}
      </div>

      {/* Footer */}
      <div className={`px-5 py-3 flex justify-end border-t ${isDark ? 'border-slate-700/60' : 'border-slate-100'}`}>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-md shadow-blue-500/30 hover:from-blue-600 hover:to-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" />Đang xử lý...</> : <><Package size={15} />{form.id ? 'Cập nhật' : 'Tạo'} sản phẩm</>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main ChatPage ─────────────────────────────────────────────────────────────
export function ChatPage({ isDark }: ChatPageProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages]);


  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addAiMessage = (text: string) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), text, sender: 'ai', timestamp: new Date() }]);
  };

  const sendUserMessage = async () => {
    if (isSendingRef.current || isTyping) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      // Build chat history từ messages hiện tại (bỏ product_form, lấy tối đa 20 tin gần nhất)
      const chatHistory = messages
        .filter(m => !m.type || m.type === 'chat')
        .slice(-20)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const formData = new FormData();
      formData.append('question', currentInput);
      formData.append('role', 'admin');
      formData.append('chat_history', JSON.stringify(chatHistory));

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/chatbot/`, formData);
      const data = response.data;

      if (data.action === 'show_product_form') {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), text: data.answer || 'Điền thông tin sản phẩm vào form bên dưới 👇', sender: 'ai', timestamp: new Date() },
          { id: crypto.randomUUID(), text: '', sender: 'ai', timestamp: new Date(), type: 'product_form', formPrefill: data.prefill },
        ]);
      } else {
        let text = '';
        if (data.action === 'general_chat' || data.action === 'statistics') {
          text = data.answer;
        } else if (data.action === 'navigate' && data.payload?.path) {
          text = data.message || `Đang chuyển hướng đến ${data.payload.path}...`;
          setTimeout(() => navigate(data.payload.path), 1000);
        } else if (data.success) {
          text = data.answer || data.message || `Đã thực thi ${data.action} thành công.`;
        } else {
          text = `${data.error}`;
        }
        addAiMessage(text);
      }
    } catch {
      addAiMessage('❌ Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setIsTyping(false);
      isSendingRef.current = false;
    }
  };

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative">
          <div className="flex justify-between items-center bg-gray-800 text-gray-200 px-4 py-2 text-sm font-mono rounded-t-2xl">
            <span>{match[1]}</span>
            <button onClick={() => copyToClipboard(String(children).replace(/\n$/, ''), 'code-block')} className="flex items-center gap-1 text-xs hover:text-white">
              {copiedId === 'code-block' ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === 'code-block' ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-b-2xl" {...props}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
      );
    },
    table: ({ children }: any) => <div className="overflow-x-auto my-2 rounded-2xl border border-gray-300"><table className="min-w-full border-collapse">{children}</table></div>,
    th: ({ children }: any) => <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left">{children}</th>,
    td: ({ children }: any) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-4 my-2 italic text-gray-700">{children}</blockquote>,
    ul: ({ children }: any) => <ul className="list-disc pl-5 my-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
    li: ({ children }: any) => <li className="my-1">{children}</li>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>,
    a: ({ children, href }: any) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  };

  const renderComposer = (centered: boolean) => (
    <div className={`group/chat relative rounded-full ${centered ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="pointer-events-none absolute -inset-[2px] rounded-full opacity-0 blur-[2px] transition-opacity duration-300 group-focus-within/chat:opacity-100"
        style={{ background: isDark ? 'linear-gradient(120deg,#22d3ee,#38bdf8,#6366f1,#a78bfa,#f472b6)' : 'linear-gradient(120deg,#60a5fa,#2dd4bf,#818cf8,#c084fc,#fb7185)' }} />
      <div className={`rounded-full border px-6 py-4 shadow-sm relative transition-all duration-300 focus-within:shadow-lg outline-none overflow-hidden ${isDark ? 'border-slate-700 bg-slate-900 shadow-slate-950/40 focus-within:border-cyan-500/50'
        : 'border-slate-200 bg-white shadow-slate-200/70 focus-within:border-blue-400 focus-within:shadow-blue-400/30'}`}>
        <div className="flex items-center gap-3">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (e.repeat) return;
                const n = e.nativeEvent as KeyboardEvent;
                if (n.isComposing || n.keyCode === 229) return;
                e.preventDefault();
                sendUserMessage();
              }
            }}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className={`w-full py-1 text-lg bg-transparent appearance-none resize-none ${isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-gray-800 placeholder:text-gray-400'}`}
            style={{ minHeight: '32px', maxHeight: '200px', border: 'none', outline: 'none', boxShadow: 'none' }}
          />
          <button onClick={sendUserMessage} disabled={isTyping || !inputValue.trim()}
            className="p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-colors shadow-md shadow-blue-300/50 flex-shrink-0">
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative flex flex-col h-[calc(100vh-4rem)] ${isDark ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900' : 'bg-gradient-to-b from-slate-100 via-slate-100 to-blue-50'}`}>
      {hasMessages ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <AnimatePresence>
                {messages.map((message, idx) => {
                  const prevMsg = messages[idx - 1];
                  // Show AI divider before every AI message that follows a user message
                  const showDivider = message.sender === 'ai' && message.type !== 'product_form' && prevMsg?.sender === 'user';

                  return (
                    <React.Fragment key={message.id}>
                      {/* ── Animated AI Divider ── */}
                      {showDivider && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className={`my-5 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'}`}
                        />
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`mb-8 ${message.sender === 'user' ? 'flex justify-end' : 'w-full'}`}
                      >
                        {message.type === 'product_form' ? (
                          <div className="w-full max-w-2xl">
                            <ProductFormCard isDark={isDark} prefill={message.formPrefill}
                              onSuccess={name => addAiMessage(`✅ Sản phẩm **"${name}"** đã được ${message.formPrefill?.id ? 'cập nhật' : 'tạo'} thành công và đã xuất hiện trong danh sách sản phẩm!`)} />
                          </div>
                        ) : message.sender === 'user' ? (
                          /* ── User message ── */
                          <div className="flex flex-col items-end max-w-[70%]">
                            <div className={`px-5 py-3 rounded-3xl text-sm leading-relaxed ${isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-gray-800'
                              }`}>
                              {message.text}
                            </div>
                            <span className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          /* ── AI message: full-width, ChatGPT style ── */
                          <div className="w-full group/msg relative">
                            <div className={`prose prose-sm max-w-none leading-relaxed ${isDark ? 'prose-invert text-slate-100' : 'text-gray-800'
                              }`}>
                              <ReactMarkdown components={MarkdownComponents}>{message.text}</ReactMarkdown>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button onClick={() => copyToClipboard(message.text, message.id)}
                                className={`p-1 rounded-lg opacity-0 group-hover/msg:opacity-100 transition-opacity ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-gray-400'
                                  }`}>
                                {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 w-full">
                  {/* Typing divider */}
                  <div className={`my-5 h-px ${isDark ? 'bg-gradient-to-r from-transparent via-slate-600 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'}`} />
                  {/* Animated dots */}
                  <div className="flex gap-1.5 items-center py-2">
                    {[0, 0.18, 0.36].map((d, i) => (
                      <motion.div key={i}
                        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d, ease: 'easeInOut' }}
                        className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-indigo-400'
                          }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="max-w-4xl mx-auto">{renderComposer(false)}</div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl">
            <div className="mb-8">
              <div className="mb-8">
                <p className="text-4xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 leading-tight">Xin chào Phuc!</p>
                <p className={`text-4xl md:text-5xl font-semibold leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Chúng ta nên bắt đầu từ đâu nhỉ?</p>
              </div>
            </div>
            {renderComposer(true)}
          </div>
        </div>
      )}
    </div>
  );
}
