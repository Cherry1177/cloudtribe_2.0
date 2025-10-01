"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import BuyerOrderCard from "@/components/tribe_resident/buyer/BuyerOrderCard";
import HistoryManagement from "@/components/history/HistoryManagement";
import { Order } from "@/interfaces/tribe_resident/buyer/order";
import UserService from "@/services/user/user";

interface OrderManagementProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[]; // List of orders passed as props
  fetchOrders: () => void; // Function to refetch orders
}

const OrderManagement: React.FC<OrderManagementProps> = ({ isOpen, onClose, orders, fetchOrders }) => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [user, setUser] = useState(UserService.getLocalStorageUser());
  const [loading, setLoading] = useState(false);

  // State variables for order filtering
  const [orderStatus, setOrderStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");
  const [showHistoryManagement, setShowHistoryManagement] = useState(false);

  // Fetch orders directly from the buyer endpoint
  const fetchBuyerOrders = async () => {
    if (!user || !user.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/buyer/${user.id}`);
      if (response.ok) {
        const buyerOrders = await response.json();
        setFilteredOrders(buyerOrders);
      } else {
        setError("無法載入訂單資料");
      }
    } catch (error) {
      console.error('Error fetching buyer orders:', error);
      setError("載入訂單時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when component opens
  useEffect(() => {
    if (isOpen && user && user.id) {
      fetchBuyerOrders();
    }
  }, [isOpen, user]);

  /**
   * Memoized function to filter orders based on status and date range
   */
  const finalFilteredOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      // Status filter
      if (orderStatus !== "all" && order.order_status !== orderStatus) {
        return false;
      }

      // Date range filter (if implemented later)
      // Add date filtering logic here if needed

      return true;
    });
  }, [filteredOrders, orderStatus]);

  /**
   * Calculate the total price of the filtered orders
   */
  const totalPrice = finalFilteredOrders.reduce((total, order) => total + order.total_price, 0);

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-2xl h-full overflow-y-auto" aria-describedby="form-description">
        <SheetHeader>
          <SheetTitle>我的訂單</SheetTitle>
          <SheetClose />
        </SheetHeader>
        <div className="p-4">
          {/* Filtering controls */}
          <>
            {/* Order status buttons */}
            <div className="w-full flex flex-wrap justify-center gap-2 mt-4">
              <Button
                variant={orderStatus === "all" ? "default" : "outline"}
                onClick={() => setOrderStatus("all")}
                className="text-sm"
              >
                全部訂單
              </Button>
              <Button
                variant={orderStatus === "未接單" ? "default" : "outline"}
                onClick={() => setOrderStatus("未接單")}
                className="text-sm"
              >
                ⏳ 未接單
              </Button>
              <Button
                variant={orderStatus === "接單" ? "default" : "outline"}
                onClick={() => setOrderStatus("接單")}
                className="text-sm"
              >
                🚚 已接單
              </Button>
              <Button
                variant={orderStatus === "配送中" ? "default" : "outline"}
                onClick={() => setOrderStatus("配送中")}
                className="text-sm"
              >
                🛣️ 配送中
              </Button>
              <Button
                variant={orderStatus === "已完成" ? "default" : "outline"}
                onClick={() => setOrderStatus("已完成")}
                className="text-sm"
              >
                ✅ 已完成
              </Button>
            </div>

            {/* History Management Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowHistoryManagement(true)}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                📊 交易記錄管理
              </Button>
            </div>

            {/* Refresh button */}
            <div className="w-full flex justify-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBuyerOrders}
                disabled={loading}
                className="text-sm"
              >
                {loading ? '🔄 載入中...' : '↻ 重新整理'}
              </Button>
            </div>

            {/* Display total price if there are matching orders */}
            {finalFilteredOrders.length > 0 && (
              <div className="w-full flex justify-center mt-4">
                <span className="text-lg font-bold">總金額: {totalPrice.toFixed(2)} 元</span>
              </div>
            )}
          </>

          {/* Display error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">載入訂單中...</p>
            </div>
          )}

          {/* Render order cards or display a message if no orders match */}
          {!loading && !error && (
            filteredOrders.length > 0 ? (
              finalFilteredOrders.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {finalFilteredOrders.map((order) => (
                    <BuyerOrderCard key={`${order.service}-${order.id}`} order={order} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-center text-gray-600">沒有符合條件的訂單</p>
                </div>
              )
            ) : (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-center text-blue-600">您還沒有任何訂單</p>
                <p className="text-center text-sm text-blue-500 mt-1">開始購物來建立您的第一筆訂單吧！</p>
              </div>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* History Management Sheet */}
    <Sheet open={showHistoryManagement} onOpenChange={setShowHistoryManagement}>
      <SheetContent 
        side="right"
        className="w-full sm:max-w-4xl p-0 sm:p-6"
      >
        <SheetHeader className="p-6 sm:p-0">
          <SheetTitle>交易記錄管理</SheetTitle>
          <SheetClose />
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-80px)] p-6 sm:p-0">
          {user && (
            <HistoryManagement 
              userId={user.id} 
              userType="buyer" 
              userName={user.name}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
};

export default OrderManagement;
