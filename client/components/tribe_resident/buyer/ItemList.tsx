"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faSortAmountDown } from '@fortawesome/free-solid-svg-icons';
import PaginationDemo from "@/components/tribe_resident/buyer/PaginationDemo";
import { Button } from "@/components/ui/button";
import { Product } from '@/interfaces/tribe_resident/buyer/buyer';  
import { ItemListProps } from '@/interfaces/tribe_resident/buyer/buyer';
import { getImageSrcWithRetry, getFallbackImage } from '@/lib/imageUtils';

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

  // === options choice function ===
  const [optionSelections, setOptionSelections] = useState<Record<string, Record<string, string[]>>>({});

  const toggleOption = (productId: string, optionId: string, choice: string, max = 2) => {
    setOptionSelections(prev => {
      const productSel = prev[productId] ?? {};
      const current = productSel[optionId] ?? [];
      const exists = current.includes(choice);

      let next: string[];
      if (exists) {
        next = current.filter(c => c !== choice);
      } else {
        if (current.length >= max) {
          next = current; // ignore if max reached
        } else {
          next = [...current, choice];
        }
      }

      return {
        ...prev,
        [productId]: {
          ...productSel,
          [optionId]: next,
        }
      };
    });
  };
  // === choice options function end ===

  useEffect(() => {
    // Sort the products based on the current sort order.
    const sorted = [...products].sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
    setSortedProducts(sorted);
  }, [products, sortOrder]);

  /**
   * 判斷是否為飲料（得正類別 or 無圖片）
   */
  const isDrink = (product: Product) => {
    return (
      !product.img ||
      product.category === "得正" ||
      (product as any).store === "得正" ||
      (product as any).type === "drink"
    );
  };

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
   * Gets the image URL for a product, with retry logic for external images
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
    
    return getImageSrcWithRetry(product, retryCount);
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
            
            {/* === Product Image with Fallback (飲料類不顯示) === */}
            {!isDrink(product) && (
              <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
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
                      console.log(`Retrying image load for product ${productId}, attempt ${currentRetryCount + 1}`);
                      setImageRetries(prev => new Map(prev).set(productId, currentRetryCount + 1));
                      target.src = getImageUrl(product);
                    } else {
                      console.log(`Using fallback image for product ${productId} after ${currentRetryCount} retries`);
                      setImageErrors(prev => new Set(prev).add(productId));
                      target.src = getFallbackImage(product);
                    }
                  }}
                />
              </div>
            )}
            {/* === Product Image End === */}

            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3rem] flex items-center justify-center text-center">
                {product.name}
              </h2>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-red-500 mb-2">參考價格: {Math.floor(product.price)} 元</p>
                <p className="text-sm text-gray-500">{product.location}</p>
              </div>

              {/* === 選項 (醬料 / 冰度 / 甜度) === */}
              {product.options?.map(opt => {
                const max = opt.max ?? opt.choices.length;
                const selected = optionSelections[product.id]?.[opt.id] ?? [];
                return (
                  <div key={opt.id} className="mb-4">
                    <p className="text-sm font-semibold mb-2">{opt.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {opt.choices.map(choice => {
                        const checked = selected.includes(choice);
                        const disabled = !checked && selected.length >= max;
                        return (
                          <label
                            key={choice}
                            className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
                              checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleOption(product.id, opt.id, choice, max)}
                            />
                            {choice}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">已選 {selected.length} / {max}</p>
                  </div>
                );
              })}
              {/* === 選項結束 === */}

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
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    const quantityInput = document.getElementById(`quantity-${product.id}`) as HTMLInputElement;
                    const quantity = parseInt(quantityInput?.value || '1', 10);

                    if (product.options && product.options.length > 0) {
                      for (const opt of product.options) {
                        const selected = optionSelections[product.id]?.[opt.id] ?? [];
                        const min = opt.min ?? 0;
                        const max = opt.max ?? opt.choices.length;
                        if (selected.length < min || selected.length > max) {
                          setAddedMessage(`${opt.label} 需選 ${min === max ? max : `${min}-${max}`} 個`);
                          setTimeout(() => setAddedMessage(null), 2000);
                          return;
                        }
                      }
                    }

                    if (quantity > 0) {
                      const selectedOptions = product.options
                        ? Object.fromEntries(
                            product.options.map(opt => [opt.id, optionSelections[product.id]?.[opt.id] ?? []])
                          )
                        : undefined;

                      const productWithOptions = { ...product, selectedOptions };
                      addToCart(productWithOptions, quantity);
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
