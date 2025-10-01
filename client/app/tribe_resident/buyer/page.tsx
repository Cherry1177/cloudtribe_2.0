"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/tribe_resident/buyer/Sidebar";
import SearchBar from "@/components/tribe_resident/buyer/SearchBar";
import ItemList from "@/components/tribe_resident/buyer/ItemList";
import CartModal from "@/components/tribe_resident/buyer/CartModal";
import AddItemForm from "@/components/tribe_resident/buyer/AddItemForm";
import OrderManagement from "@/components/tribe_resident/buyer/OrderManagement";
import "@/app/styles/globals.css";
import { UnifiedNavigation } from "@/components/UnifiedNavigation";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery } from "react-responsive";
import UserService from "@/services/user/user";
import { Product } from "@/interfaces/tribe_resident/buyer/buyer";
import { CartItem } from "@/interfaces/tribe_resident/buyer/buyer";
import { Order } from "@/interfaces/tribe_resident/buyer/order";

/**
 * The number of items to display per page
 */
const ITEMS_PER_PAGE = 16;

/**
 * Generate a stable ID for new items
 */
let idCounter = 1;
const generateStableId = () => `custom-item-${idCounter++}`;

/**
 * A functional component representing the buyer's page where users can browse and add items to their cart.
 */
const BuyerPage: React.FC = () => {

  // Use lazy initialization to load the cart from the local storage
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      try {
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (e) {
        console.error("localStorage error:", e);
        return [];
      }
    }
    return [];
  });

  // State variables for managing products, cart, and user data
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [user, setUser] = useState(UserService.getLocalStorageUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Media query hooks to detect the device type
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });


  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Handles the click event for the "Test login status" button
   */

  const handleApplyBuyerClick = () => {
    if (!user || user.id === 0 || user.name === 'empty' || user.phone === 'empty') {
        alert('請先按右上角的登入');
    } else {
        setIsCartOpen(true)
    }
  };

  /**
   * Fetches order data from the server and updates the state
   */
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders/");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const allOrders: Order[] = await response.json();
      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  /**
   * Sets up an event listener to handle changes in user data
   */
  useEffect(() => {
    const handleUserDataChanged = () => {
      const updatedUser = UserService.getLocalStorageUser();
      setUser(updatedUser);
    };

    window.addEventListener("userDataChanged", handleUserDataChanged);

    return () => {
      window.removeEventListener("userDataChanged", handleUserDataChanged);
    };
  }, []);


  useEffect(() => {
    try {
      if (cart.length === 0) {
        localStorage.removeItem('cart');
      } else {
        localStorage.setItem("cart", JSON.stringify(cart));
      }
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
    }
  }, [cart]);

  /**
   * Handles the click event for viewing filled forms.
   * Fetches order data and opens the form modal if the user is logged in.
   */
  const handleViewForm = () => {
    if (!user || user.id === 0) {
      alert("請先按右上角的登入");
    } else {
      fetchOrders();
      setIsFormOpen(true);
    }
  };

  /**
   * Filters products by category and updates the filteredProducts state
   * @param {string} category - The selected category to filter by
   */
  const handleFilterCategory = useCallback(
    (category: string) => {
      const filtered = products.filter((product) => product.category === category);
      setFilteredProducts(filtered);
      setSelectedCategory(category);
    },
    [products]
  );

  /**
   * Searches for products by name and updates the filteredProducts state
   * @param {string} query - The search query
   */
  const handleSearch = useCallback(
    (query: string) => {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
      setSelectedCategory(null);
    },
    [products]
  );

  /**
   * Adds a product to the cart with the specified quantity
   * @param {Product} product - The product to add
   * @param {number} quantity - The quantity of the product to add
   */
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Update the quantity of the existing item
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        // Add a new item to the cart
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  /**
   * Removes an item from the cart by its ID
   * @param {string} id - The ID of the item to remove
   */
  const handleRemoveFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  /**
   * Updates the quantity of an item in the cart
   * @param {string} id - The ID of the item to update
   * @param {number} quantity - The new quantity for the item
   */
  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(item.quantity + quantity, 1) } : item
      )
    );
  };

  /**
   * Clears all items from the cart
   */
  const clearCart = () => {
    setCart([]);
  };

  /**
   * Fetches product data from the server when the component mounts
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data.json");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: Product[] = await response.json();
        setProducts(data);
        setInitialLoad(false);
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <UnifiedNavigation title="部落居民 - 買家" />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 text-center">
          <h1 className="text-5xl lg:text-6xl font-bold mb-6">
            🍽️ 今天我想要來點...
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            探索各種美食選擇，找到您最喜歡的料理
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-8">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              variant="outline" 
              onClick={handleViewForm}
              className="h-12 px-6 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              查看已填寫表單
            </Button>

            <Button 
              variant="outline" 
              onClick={() => setIsAddItemFormOpen(true)}
              className="h-12 px-6 bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white font-semibold rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              找不到商品？點此加入
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">搜尋商品</label>
                <SearchBar onSearch={handleSearch} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">商品分類</label>
                <Sidebar filterCategory={handleFilterCategory} className="w-full" />
              </div>
            </div>
          </div>

          {/* Selected Category Display */}
          {selectedCategory && (
            <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
              <h3 className="text-xl font-semibold text-blue-800">
                目前分類: {selectedCategory}
              </h3>
            </div>
          )}

          {/* Products Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!initialLoad && (filteredProducts.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">商品列表</h2>
                <ItemList
                  products={filteredProducts}
                  itemsPerPage={ITEMS_PER_PAGE}
                  addToCart={handleAddToCart}
                />
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">找不到任何商品</h3>
                <p className="text-gray-600 mb-6">請嘗試其他搜尋條件或商品分類</p>
                <Button 
                  onClick={() => setIsAddItemFormOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl"
                >
                  找不到商品？點此加入
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Shopping Cart Button */}
      {isMounted && (
        <Button
          onClick={handleApplyBuyerClick}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl z-50 transition-all duration-300 hover:scale-105"
        >
          <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
          購物車 ({cart.reduce((total, item) => total + item.quantity, 0)})
        </Button>
      )}

      {/* Modals */}
      {isAddItemFormOpen && (
        <AddItemForm
          onClose={() => setIsAddItemFormOpen(false)}
          addToCart={(item) =>
            handleAddToCart(
              { ...item, category: "Purchase", id: generateStableId() },
              item.quantity
            )
          }
        />
      )}

      {isCartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          removeFromCart={handleRemoveFromCart}
          updateQuantity={handleUpdateQuantity}
          clearCart={clearCart}
          cartItems={cart}
          totalPrice={cart.reduce((total, item) => total + item.price * item.quantity, 0)}
        />
      )}

      <OrderManagement
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        orders={orders}
        fetchOrders={fetchOrders}
      />
    </div>
  );
};

export default BuyerPage;
