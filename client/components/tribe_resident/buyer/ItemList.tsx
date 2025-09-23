"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faDollarSign, faSortAmountDown } from '@fortawesome/free-solid-svg-icons';
import PaginationDemo from "@/components/tribe_resident/buyer/PaginationDemo";
import { Button } from "@/components/ui/button";
import { Product } from '@/interfaces/tribe_resident/buyer/buyer';  
import { ItemListProps } from '@/interfaces/tribe_resident/buyer/buyer';

/**
 * Renders a list of items with pagination and sorting functionality.
 *
 * @param products - The array of products to display.
 * @param itemsPerPage - The number of items to display per page.
 * @param addToCart - The function to add a product to the cart.
 */
const ItemList: React.FC<ItemListProps> = ({ products, itemsPerPage, addToCart }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedProducts, setSortedProducts] = useState<Product[]>(products);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [addedMessage, setAddedMessage] = useState<string | null>(null); // State for notification message
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set()); // Track failed images
  const [imageRetries, setImageRetries] = useState<Map<string, number>>(new Map()); // Track retry attempts
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set()); // Track loading images

  useEffect(() => {
    // Sort the products based on the current sort order.
    const sorted = [...products].sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
    setSortedProducts(sorted);
  }, [products, sortOrder]);

  /**
   * Handles the page change event.
   *
   * @param page - The new page number.
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Toggles the sort order between ascending and descending.
   */
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentData = sortedProducts.slice(startIdx, endIdx);

  /**
   * Gets the appropriate fallback image based on product name and category
   * @param product - The product to get fallback image for
   * @returns The fallback image path
   */
  const getFallbackImage = (product: Product): string => {
    const productName = product.name.toLowerCase();
    
    // More specific fallbacks based on product name keywords
    if (productName.includes('牛肉') || productName.includes('肉片') || productName.includes('肉類') || productName.includes('漢堡肉')) {
      return '/eat.jpg';
    } else if (productName.includes('雞精') || productName.includes('養生') || productName.includes('維他命') || productName.includes('發泡錠')) {
      return '/eat.jpg';
    } else if (productName.includes('棉花棒') || productName.includes('尿褲') || productName.includes('看護墊') || productName.includes('紙尿褲')) {
      return '/eat.jpg';
    } else if (productName.includes('馬鈴薯') || productName.includes('土豆') || productName.includes('蔬菜')) {
      return '/vegetable1.jpg';
    } else if (productName.includes('金針菇') || productName.includes('菇') || productName.includes('菇類')) {
      return '/vegetable2.jpg';
    } else if (productName.includes('水果') || productName.includes('果') || productName.includes('果類')) {
      return '/fruit1.jpg';
    } else if (product.category.includes('蔬菜') || product.category.includes('蔬菜類')) {
      return '/vegetable1.jpg';
    } else if (product.category.includes('水果') || product.category.includes('水果類')) {
      return '/fruit1.jpg';
    } else if (product.category.includes('肉類') || product.category.includes('海鮮') || product.category.includes('肉品')) {
      return '/eat.jpg';
    } else {
      // Use product ID to cycle through available images
      const imageIndex = parseInt(product.id.slice(-1)) % 4;
      const fallbackImages = ['/vegetable1.jpg', '/vegetable2.jpg', '/fruit1.jpg', '/eat.jpg'];
      return fallbackImages[imageIndex];
    }
  };

  /**
   * Gets the image URL for a product, with retry logic for Carrefour images
   * @param product - The product to get image URL for
   * @returns The image URL
   */
  const getImageUrl = (product: Product): string => {
    const productId = product.id;
    const retryCount = imageRetries.get(productId) || 0;
    
    if (imageErrors.has(productId)) {
      console.log(`Using fallback image for product ${productId}: ${product.name}`);
      return getFallbackImage(product);
    }
    
    if (product.category === "小木屋鬆餅" || product.category === "金鰭" || product.category === "原丼力") {
      return `/test/${encodeURIComponent(product.img)}`;
    }
    
    if (product.img.startsWith('http')) {
      return product.img;
    }
    
    if (product.img.startsWith('/external-image/')) {
      // Try different Carrefour URL formats
      const baseUrl = 'https://online.carrefour.com.tw';
      let url = '';
      
      if (retryCount === 0) {
        url = `${baseUrl}${product.img}`;
      } else if (retryCount === 1) {
        // Try without the /external-image/ prefix
        url = `${baseUrl}${product.img.replace('/external-image', '')}`;
      } else if (retryCount === 2) {
        // Try with different domain
        url = `https://www.carrefour.com.tw${product.img}`;
      } else {
        return getFallbackImage(product);
      }
      
      console.log(`Trying Carrefour image for product ${productId} (attempt ${retryCount + 1}): ${url}`);
      return url;
    }
    
    const baseUrl = 'https://online.carrefour.com.tw';
    return `${baseUrl}${product.img}`;
  };

  return (
    <div className="relative">
      <div className="flex justify-end mb-4">
        <Button onClick={toggleSortOrder}>
          <FontAwesomeIcon icon={faSortAmountDown} className="mr-2" />
          {sortOrder === 'asc' ? '價格由小到大' : '價格由大到小'}
        </Button>
      </div>

      {/* Notification Overlay */}
      {addedMessage && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          aria-live="assertive"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold text-green-700">{addedMessage}</p>
            <Button 
              className="mt-4 bg-green-600 text-white"
              onClick={() => setAddedMessage(null)}
            >
              關閉
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentData.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            {/* Product Image with Fallback */}
            <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
              {/* Loading Spinner */}
              {loadingImages.has(product.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <img 
                src={getImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                onLoad={() => {
                  setLoadingImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(product.id);
                    return newSet;
                  });
                }}
                onLoadStart={() => {
                  setLoadingImages(prev => new Set(prev).add(product.id));
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const productId = product.id;
                  const currentRetryCount = imageRetries.get(productId) || 0;
                  
                  console.log(`Image load error for product ${productId} (${product.name}), retry count: ${currentRetryCount}`);
                  
                  setLoadingImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                  });
                  
                  if (currentRetryCount < 3) {
                    // Retry with different URL format
                    console.log(`Retrying image load for product ${productId}, attempt ${currentRetryCount + 1}`);
                    setImageRetries(prev => new Map(prev).set(productId, currentRetryCount + 1));
                    target.src = getImageUrl(product);
                  } else {
                    // Mark this image as failed and use fallback
                    console.log(`Using fallback image for product ${productId} after ${currentRetryCount} retries`);
                    setImageErrors(prev => new Set(prev).add(productId));
                    target.src = getFallbackImage(product);
                  }
                }}
              />
              {/* Fallback Image Indicator */}
              {imageErrors.has(product.id) && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  參考圖片
                </div>
              )}
              
              {/* Image placeholder overlay */}
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="text-gray-500 text-sm text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  點擊查看大圖
                </div>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3rem] flex items-center justify-center text-center">
                {product.name}
              </h2>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-red-500 mb-2">參考價格: {Math.floor(product.price)} 元</p>
                <p className="text-sm text-gray-500">{product.location}</p>
              </div>

              <div className="flex items-center justify-center mb-4">
                <label htmlFor={`quantity-${product.id}`} className="text-sm font-semibold text-gray-700 mr-2">購買數量:</label>
                <input
                  type="number"
                  id={`quantity-${product.id}`}
                  className="w-16 text-center border-2 border-gray-200 focus:border-blue-500 rounded-lg px-2 py-1"
                  defaultValue={1}
                  min={1}
                />
              </div>

              <div className="space-y-3">
                {/* Add to cart button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    const quantityInput = document.getElementById(`quantity-${product.id}`) as HTMLInputElement;
                    const quantity = parseInt(quantityInput?.value || '1', 10);

                    if (quantity > 0) {
                      addToCart(product, quantity);
                      setAddedMessage(`${product.name} (${quantity} 件) 已經加入購物車`);

                      setTimeout(() => setAddedMessage(null), 2000);
                    } else {
                      setAddedMessage("購買數量必須大於 0");
                      setTimeout(() => setAddedMessage(null), 2000);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  加入購物車
                </Button>

                {/* Product link to check the actual price */}
                <a 
                  href={`https://online.carrefour.com.tw/zh/search/?q=${encodeURIComponent(product.name.replace(/\(.*?\)|※.*$|因.*$/g, '').trim())}`}   
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
                    查看實際價格
                  </Button>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <PaginationDemo
        totalItems={products.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ItemList;
