"use client";

import React, { useState } from 'react'; 
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { CartModalProps } from '@/interfaces/tribe_resident/buyer/buyer';
import CheckoutForm from "@/components/tribe_resident/buyer/CheckoutForm";
import { Product } from '@/interfaces/tribe_resident/buyer/buyer';

/**
 * Represents a modal component for displaying and managing the shopping cart.
 * @param {Array} cart - The array of items in the cart.
 * @param {Function} onClose - The function to close the modal.
 * @param {Function} removeFromCart - The function to remove an item from the cart.
 * @param {Function} updateQuantity - The function to update the quantity of an item in the cart.
 * @param {Function} clearCart - The function to clear the entire cart.
 * @param {number} cartItems - The total number of items in the cart.
 * @param {number} totalPrice - The total price of all items in the cart.
 */
const CartModal: React.FC<CartModalProps> = ({ cart, onClose, removeFromCart, updateQuantity, clearCart, cartItems, totalPrice }) => {
  // State to determine if the checkout process is initiated
  const [isCheckout, setIsCheckout] = useState(false);
  
  // State to manage and display error messages
  const [error, setError] = useState("");
  
  // State for image loading
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageRetries, setImageRetries] = useState<Map<string, number>>(new Map());
  
  // Calculate the total price of all items in the cart
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Gets the appropriate fallback image based on product name and category
   * @param item - The cart item to get fallback image for
   * @returns The fallback image path
   */
  const getFallbackImage = (item: any): string => {
    const productName = item.name.toLowerCase();
    
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
    } else if (item.category && (item.category.includes('蔬菜') || item.category.includes('蔬菜類'))) {
      return '/vegetable1.jpg';
    } else if (item.category && (item.category.includes('水果') || item.category.includes('水果類'))) {
      return '/fruit1.jpg';
    } else if (item.category && (item.category.includes('肉類') || item.category.includes('海鮮') || item.category.includes('肉品'))) {
      return '/eat.jpg';
    } else {
      // Use product ID to cycle through available images
      const imageIndex = parseInt(item.id.slice(-1)) % 4;
      const fallbackImages = ['/vegetable1.jpg', '/vegetable2.jpg', '/fruit1.jpg', '/eat.jpg'];
      return fallbackImages[imageIndex];
    }
  };

  /**
   * Gets the image URL for a cart item, with retry logic for Carrefour images
   * @param item - The cart item to get image URL for
   * @returns The image URL
   */
  const getImageUrl = (item: any): string => {
    const itemId = item.id;
    const retryCount = imageRetries.get(itemId) || 0;
    
    if (imageErrors.has(itemId)) {
      return getFallbackImage(item);
    }
    
    if (item.category === "小木屋鬆餅" || item.category === "金鰭" || item.category === "原丼力") {
      return `/test/${encodeURIComponent(item.img)}`;
    }
    
    if (item.img.startsWith('http')) {
      return item.img;
    }
    
    if (item.img.startsWith('/external-image/')) {
      // Try different Carrefour URL formats
      const baseUrl = 'https://online.carrefour.com.tw';
      let url = '';
      
      if (retryCount === 0) {
        url = `${baseUrl}${item.img}`;
      } else if (retryCount === 1) {
        // Try without the /external-image/ prefix
        url = `${baseUrl}${item.img.replace('/external-image', '')}`;
      } else if (retryCount === 2) {
        // Try with different domain
        url = `https://www.carrefour.com.tw${item.img}`;
      } else {
        return getFallbackImage(item);
      }
      
      return url;
    }
    
    const baseUrl = 'https://online.carrefour.com.tw';
    return `${baseUrl}${item.img}`;
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-xl overflow-y-auto max-h-[80vh]">
        <SheetHeader>
          {/* Display the total number of items in the cart */}
          <SheetTitle>購物車結帳 ({cart.reduce((total, item) => total + item.quantity, 0)})</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          {/* Display any error messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Loop through each item in the cart and render them */}
          {cart.map((item) => (
            <React.Fragment key={item.id}>
              <div className="relative flex items-center mb-4 bg-white p-4 rounded shadow">
                {/* Button to remove an item from the cart */}
                <Button 
                  variant="outline" 
                  className="absolute top-0 left-0 w-6 h-6 bg-black text-white p-1" 
                  onClick={() => removeFromCart(item.id)}
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="text-white text-xs" />
                </Button>
                
                {/* Item image */}
                <div className="relative w-16 h-16 mr-4">
                  <img 
                    src={getImageUrl(item)}
                    alt={item.name} 
                    width={64} 
                    height={64} 
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const itemId = item.id;
                      const currentRetryCount = imageRetries.get(itemId) || 0;
                      
                      if (currentRetryCount < 3) {
                        // Retry with different URL format
                        setImageRetries(prev => new Map(prev).set(itemId, currentRetryCount + 1));
                        target.src = getImageUrl(item);
                      } else {
                        // Mark this image as failed and use fallback
                        setImageErrors(prev => new Set(prev).add(itemId));
                        target.src = getFallbackImage(item);
                      }
                    }}
                  />
                  {/* Fallback Image Indicator */}
                  {imageErrors.has(item.id) && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold">
                      參考
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  {/* Item name and location */}
                  <h2 className="text-left font-bold break-words">
                    {item.name.split('(').map((part, index, array) => (
                      <React.Fragment key={index}>
                        {index === 0 ? (
                          <span className="block text-lg">{part}</span>
                        ) : (
                          <span className="block text-sm text-gray-600">({part}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </h2>
                  <h2 className="text-g font-bold truncate" style={{ maxWidth: "12rem" }}> 地點: {item.location}</h2>
                  
                  {/* Item price and quantity */}
                  <p> {Math.floor(item.price)} 元 x {item.quantity} = {Math.floor(item.price * item.quantity)} 元</p>
                  <div className="flex items-center justify-between">
                    {/* Buttons to update the item quantity */}
                    <Button variant="outline" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                    <input
                      title="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {                     
                        const inputValue = e.target.value.trim();
                        if (inputValue === "") {
                          // If the input is empty, set the quantity to 1
                          updateQuantity(item.id, 1 - item.quantity);
                          return;
                        }
                        const newQuantity = parseInt(inputValue, 10);
                        if (!isNaN(newQuantity) && newQuantity >= 1) {
                          updateQuantity(item.id, newQuantity - item.quantity);
                        } else {
                          setError("請輸入有效的數量");
                        }
                      }}
                      className="w-12 text-center mx-2 border rounded"
                      min={1}
                    />
                    <Button variant="outline" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Display the total price and a checkout button */}
          <div className="flex justify-between items-center font-bold text-xl">
            <span>總計: {Math.floor(totalPrice)} 元 </span>         
            <Button 
              className="bg-black text-white" 
              onClick={() => {
                if (totalPrice > 0) {
                  // Initiate the checkout process
                  setIsCheckout(true);
                } else {
                  alert('購物車中沒有商品或總價為0');
                }
              }}
            >
              結帳
            </Button>
          </div>
          <span className="text-sm text-gray-500 font-normal">
              (這裡為參考價格，實際價格以司機拿發票為主)
            </span>
        </div>
        <SheetFooter></SheetFooter>
      </SheetContent>

      {/* Render the checkout form if the checkout process is initiated */}
      {isCheckout && <CheckoutForm onClose={() => { setIsCheckout(false); onClose(); }} clearCart={clearCart} cartItems={cartItems} totalPrice={totalPrice} />}
    </Sheet>
  );
};

export default CartModal;
