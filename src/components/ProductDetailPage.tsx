import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';

interface ProductDetail {
  id: string;
  name: string;
  price: string; // API trả về string
  originalPrice?: string;
  image: string;
  rating?: number;
  category: string;
  brand?: string;
  isNew?: boolean;
  detail: {
    id: string;
    images: string[];
    rating?: number;
    reviewCount?: number;
    description?: string;
    features?: string[];
    specifications?: Record<string, string>;
    inStock?: boolean;
    hasARView?: boolean;
    product: string;
  };
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!productId) {
        setError('ID sản phẩm không hợp lệ');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/products/${productId}`);
        setProduct(response.data);
        setSelectedImage(response.data.image);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", err);
        setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  const handleBackToProducts = () => {
    navigate('/products');
  };

  // --- HÀM ĐỊNH DẠNG GIÁ MỚI ---
  const formatPrice = (priceString: string) => {
    // Làm sạch chuỗi giá (loại bỏ $, ₫, dấu phẩy...)
    const numericPrice = parseFloat(priceString.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numericPrice)) return '$0.00';
    
    // Định dạng thành tiền tệ USD
    return numericPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };
  
  // ... renderStars và các phần khác giữ nguyên ...
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
    }
    if (hasHalfStar) { /* ... logic sao nửa ... */ }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
    }
    return stars;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="w-8 h-8 text-blue-600 animate-spin" /><span className="ml-2 text-gray-600">Đang tải thông tin sản phẩm...</span></div>;
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
        <button onClick={handleBackToProducts} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Quay lại danh sách sản phẩm</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={handleBackToProducts} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại danh sách sản phẩm
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {/* ... Phần hình ảnh giữ nguyên ... */}
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.detail.images && product.detail.images.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto py-2">
              <img src={product.image} alt={product.name} className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${selectedImage === product.image ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setSelectedImage(product.image)} />
              {product.detail.images.map((image, index) => (<img key={index} src={image} alt={`${product.name} ${index + 1}`} className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${selectedImage === image ? 'border-blue-500' : 'border-transparent'}`} onClick={() => setSelectedImage(image)} />))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.isNew && (<span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Mới</span>)}
            </div>
            {product.rating && (<div className="flex items-center mt-2"><div className="flex items-center">{renderStars(product.rating)}</div><span className="ml-2 text-sm text-gray-600">{product.rating} {product.detail.reviewCount && `(${product.detail.reviewCount} đánh giá)`}</span></div>)}
          </div>

          {/* Giá đã được định dạng lại */}
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice !== product.price && (<span className="text-lg text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>)}
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
            <div><span className="text-sm text-gray-500">Danh mục</span><p className="font-medium">{product.category}</p></div>
            {product.brand && (<div><span className="text-sm text-gray-500">Thương hiệu</span><p className="font-medium">{product.brand}</p></div>)}
          </div>
        </motion.div>
      </div>

      {/* ... Phần mô tả, đặc điểm, thông số kỹ thuật giữ nguyên ... */}
      {product.detail.description && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8"><h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả sản phẩm</h2><div className="bg-gray-50 rounded-xl p-6"><p className="text-gray-700 leading-relaxed">{product.detail.description}</p></div></motion.div>)}
      {product.detail.features && product.detail.features.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8"><h2 className="text-xl font-semibold text-gray-900 mb-4">Đặc điểm nổi bật</h2><ul className="space-y-2">{product.detail.features.map((feature, index) => (<li key={index} className="flex items-start"><div className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"><svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div><span className="text-gray-700">{feature}</span></li>))}</ul></motion.div>)}
      {product.detail.specifications && Object.keys(product.detail.specifications).length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8"><h2 className="text-xl font-semibold text-gray-900 mb-4">Thông số kỹ thuật</h2><div className="bg-gray-50 rounded-xl p-4"><table className="w-full"><tbody>{Object.entries(product.detail.specifications).map(([key, value]) => (<tr key={key} className="border-b border-gray-200 last:border-b-0"><td className="py-2 pr-4 font-medium text-gray-900 w-1/3">{key}</td><td className="py-2 text-gray-700">{value}</td></tr>))}</tbody></table></div></motion.div>)}
    </div>
  );
}