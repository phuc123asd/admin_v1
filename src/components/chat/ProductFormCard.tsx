import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Package, Trash2, Loader2, Sparkles, Plus, Check, CheckCircle, X } from 'lucide-react';
import { ProductFormData } from '../../types/chat';
import { chatService } from '../../services/api';

interface ProductFormCardProps {
  isDark: boolean;
  prefill?: Partial<ProductFormData>;
  onSuccess: (productName: string) => void;
}

export function ProductFormCard({ isDark, prefill, onSuccess }: ProductFormCardProps) {
  // Normalize specifications from Object (AI format) to Array (Form format)
  const normalizedSpecs = prefill?.specifications
    ? (Array.isArray(prefill.specifications)
      ? prefill.specifications
      : Object.entries(prefill.specifications).map(([key, value]) => ({ key, value: String(value) })))
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
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiHighlight, setAiHighlight] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    Promise.all([
      chatService.getCategories(),
      chatService.getBrands(),
    ])
      .then(([catRes, brandRes]) => {
        setCategories(catRes);
        setBrands(brandRes);
      })
      .catch(() => {
        // Silently fail
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  const handleAiSuggest = async () => {
    if (!form.name.trim()) return;
    setIsAiSuggesting(true);
    try {
      const prompt = `Bạn là một chuyên gia Copywriting công nghệ. Hãy gợi ý nội dung sản phẩm chuyên nghiệp, đẳng cấp cho form: tên="${form.name}"${form.category ? `, danh mục="${form.category}"` : ''}${form.brand ? `, thương hiệu="${form.brand}"` : ''}${form.price ? `, giá=${form.price}` : ''}. 
      YÊU CẦU: 
      1. Description: Viết theo mô hình AIDA nhưng KHÔNG ghi các tiêu đề "Attention", "Interest", "Desire", "Action". Thay vào đó, hãy dùng các icon sống động (emoji) ở đầu mỗi đoạn để nội dung trông bắt mắt và chuyên nghiệp.
      2. Features: Cấu trúc Feature-Benefit, mỗi dòng bắt đầu bằng 1 icon phù hợp.
      3. Specifications: Thông số kỹ thuật chuyên sâu, chính xác.
      Hãy GỌI TOOL add_product để trả về dữ liệu này.`;

      const data = await chatService.sendMessage(prompt, 'admin', [], [], false);

      if (data.action === 'show_product_form' && data.prefill) {
        const p = data.prefill;
        if (p.description) setForm(prev => ({ ...prev, description: String(p.description) }));
        if (p.features && Array.isArray(p.features)) {
          setForm(prev => ({ ...prev, features: p.features || [] }));
        }
        if (p.specifications && typeof p.specifications === 'object') {
          const specs = Array.isArray(p.specifications)
            ? p.specifications
            : Object.entries(p.specifications).map(([key, value]) => ({ key, value: String(value) }));
          if (specs.length > 0) setForm(prev => ({ ...prev, specifications: specs }));
        }
        setAiHighlight(true);
        setTimeout(() => setAiHighlight(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const set = (field: keyof ProductFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updateFeature = (idx: number, val: string) => {
    const f = [...form.features]; f[idx] = val; set('features', f);
  };
  const addFeature = () => set('features', [...form.features, '']);
  const removeFeature = (idx: number) => set('features', form.features.filter((_, i) => i !== idx));

  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    const s = [...form.specifications]; s[idx] = { ...s[idx], [field]: val }; set('specifications', s);
  };
  const addSpec = () => set('specifications', [...form.specifications, { key: '', value: '' }]);
  const removeSpec = (idx: number) => set('specifications', form.specifications.filter((_, i) => i !== idx));

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
      let question = '';
      const keptImagesStr = [];
      if (form.mainImage) keptImagesStr.push(form.mainImage);
      if (form.galleryImages && form.galleryImages.length > 0) keptImagesStr.push(...form.galleryImages);

      if (isUpdate) {
        question = `CẬP NHẬT sản phẩm (ID: ${form.id}): 
        - Tên (name): "${form.name}"
        - Giá bán (price): ${form.price}
        - Giá gốc (originalPrice): ${form.originalPrice || form.price}
        - Danh mục (category): "${form.category}"
        - Thương hiệu (brand): "${form.brand}"
        - Mô tả (description): "${form.description}"
        - Tính năng nổi bật (features): [${form.features.filter(f => f.trim()).map(f => `"${f}"`).join(', ')}]
        - Thông số kỹ thuật (specifications): {${form.specifications.filter(s => s.key.trim()).map(s => `"${s.key}": "${s.value}"`).join(', ')}}
        - Sản phẩm mới (isNew): ${form.isNew}
        - Còn hàng (inStock): ${form.inStock}
        - Giữ lại các ảnh cũ: ${keptImagesStr.join(', ')}`;
      } else {
        question = `THÊM sản phẩm mới:
        - Tên (name): "${form.name}"
        - Giá bán (price): ${form.price}
        - Giá gốc (originalPrice): ${form.originalPrice || form.price}
        - Danh mục (category): "${form.category}"
        - Thương hiệu (brand): "${form.brand}"
        - Mô tả (description): "${form.description}"
        - Tính năng nổi bật (features): [${form.features.filter(f => f.trim()).map(f => `"${f}"`).join(', ')}]
        - Thông số kỹ thuật (specifications): {${form.specifications.filter(s => s.key.trim()).map(s => `"${s.key}": "${s.value}"`).join(', ')}}
        - Sản phẩm mới (isNew): ${form.isNew}
        - Còn hàng (inStock): ${form.inStock}`;
      }

      const data = await chatService.sendMessage(question, 'admin', [], imageFiles, true);

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

  const inp = `w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all duration-300 focus:ring-2 ${isDark
    ? 'bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500 focus:ring-cyan-500/40 focus:border-cyan-500'
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
      className={`rounded-2xl border shadow-xl overflow-hidden active-card-transition ${isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-b bg-gradient-to-r from-blue-600/10 to-violet-600/10" style={{ borderBottomStyle: 'dashed', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Package size={15} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Điền đầy đủ thông tin và bấm {form.id ? 'Cập nhật' : 'Tạo'} sản phẩm</p>
          </div>
        </div>
        <button
          onClick={handleAiSuggest}
          disabled={isAiSuggesting || !form.name.trim()}
          title={!form.name.trim() ? 'Nhập tên sản phẩm trước' : 'AI tự động gợi ý mô tả, tính năng, thông số'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm
            ${isAiSuggesting
              ? 'opacity-70 cursor-wait bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-violet-400/30'
              : !form.name.trim()
                ? isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-violet-400/30 hover:shadow-violet-400/50 hover:shadow-md'
            }`}
        >
          {isAiSuggesting
            ? <><Loader2 size={12} className="animate-spin" />Đang gợi ý...</>
            : <><Sparkles size={12} />AI Gợi ý nội dung</>}
        </button>
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
            <label className={lbl}>Giá bán ($) <span className="text-red-400">*</span></label>
            <input type="number" className={inp} placeholder="999" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Giá gốc ($)</label>
            <input type="number" className={inp} placeholder="1200" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} />
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
          <textarea
            className={`${inp} resize-none transition-all duration-500 ${aiHighlight ? (isDark ? 'ring-2 ring-violet-500/50 border-violet-500' : 'ring-2 ring-violet-400/50 border-violet-400') : ''}`}
            rows={2}
            placeholder="Mô tả ngắn hấp dẫn về sản phẩm..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
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
                <input
                  className={`${inp} transition-all duration-500 ${aiHighlight ? (isDark ? 'ring-2 ring-violet-500/50 border-violet-500' : 'ring-2 ring-violet-400/50 border-violet-400') : ''}`}
                  placeholder={`Tính năng ${i + 1} (VD: Chip A17 Pro)`}
                  value={f}
                  onChange={e => updateFeature(i, e.target.value)}
                />
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
                <input
                  className={`${inp} transition-all duration-500 ${aiHighlight ? (isDark ? 'ring-2 ring-violet-500/50 border-violet-500' : 'ring-2 ring-violet-400/50 border-violet-400') : ''}`}
                  placeholder="Tên thông số (VD: Màn hình)"
                  value={spec.key}
                  onChange={e => updateSpec(i, 'key', e.target.value)}
                />
                <span className={`flex-shrink-0 text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>:</span>
                <input
                  className={`${inp} transition-all duration-500 ${aiHighlight ? (isDark ? 'ring-2 ring-violet-500/50 border-violet-500' : 'ring-2 ring-violet-400/50 border-violet-400') : ''}`}
                  placeholder="Giá trị (VD: 6.1 inch OLED)"
                  value={spec.value}
                  onChange={e => updateSpec(i, 'value', e.target.value)}
                />
                {form.specifications.length > 1 && (
                  <button onClick={() => removeSpec(i)} className="flex-shrink-0 text-red-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Toggle: inStock & isNew */}
        <div className="flex gap-3 flex-wrap">
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

            {form.galleryImages && form.galleryImages.length > 0 && (
              <div>
                <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-teal-300' : 'text-teal-600'}`}>Ảnh thư viện hiện tại:</p>
                <div className="flex flex-wrap gap-2">
                  {form.galleryImages.map((src, i) => (
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

            <div>
              <p className={`text-xs mb-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Ảnh mới thêm (sẽ được tải lên):</p>
              <div className="flex flex-wrap gap-2 items-start">
                {imagePreviews.map((src, i) => (
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
