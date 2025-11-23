// src/pages/ProductsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader, Package, Copy, Check } from 'lucide-react'; // <-- Thêm Copy và Check

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  brand?: string;
  description?: string;
  rating?: number;
}

export function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- THÊM STATE ĐỂ QUẢN LÝ VIỆC SAO CHÉP ID ---
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
        const formattedProducts = response.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: typeof product.price === 'string' ? parseFloat(product.price.replace(/[^0-9.-]+/g, "")) : product.price,
          category: product.category,
          image: product.image,
          brand: product.brand,
          description: product.description,
          rating: product.rating
        }));
        setProducts(formattedProducts);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm:", err);
        setError('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  // --- THÊM HÀM XỬ LÝ SAO CHÉP ID ---
  const handleCopyId = async (productId: string, e: React.MouseEvent) => {
    // Ngăn sự kiện lan truyền để không điều hướng đến trang chi tiết
    e.stopPropagation(); 
    
    try {
      await navigator.clipboard.writeText(productId);
      // Thêm ID vào Set để hiển thị icon "đã sao chép"
      setCopiedIds(prev => new Set(prev).add(productId));
      
      // Sau 2 giây, xóa ID khỏi Set để trả lại icon "sao chép"
      setTimeout(() => {
        setCopiedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-gradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <path fill="url(#half-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* ... Phần Loading và Error giữ nguyên ... */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="ml-2 text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sản phẩm</h1>
              <p className="text-gray-600">Danh sách sản phẩm</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500" 
              />
            </div>
          </motion.div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: index * 0.05 }} 
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{product.category}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    {product.brand && <p className="text-sm text-gray-500 mb-2">{product.brand}</p>}
                    
                    {/* === PHẦN THÊM VÀO: HIỂN THỊ ID VÀ NÚT SAO CHÉP === */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400">ID: {product.id}</p>
                      <button
                        onClick={(e) => handleCopyId(product.id, e)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title={copiedIds.has(product.id) ? "Đã sao chép!" : "Sao chép ID"}
                      >
                        {copiedIds.has(product.id) ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    {product.rating && (
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">{renderStars(product.rating)}</div>
                        <span className="ml-2 text-sm text-gray-600">{product.rating}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-semibold text-gray-900">{formatPrice(product.price)}</span>
                    </div>
                    {product.description && <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có sản phẩm nào</h3>
              <p className="text-gray-600">Kho hàng của bạn hiện đang trống.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}