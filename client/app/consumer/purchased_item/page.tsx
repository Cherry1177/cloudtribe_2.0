'use client'
import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UnifiedNavigation } from "@/components/UnifiedNavigation"
import { OrderedProductTable } from "@/components/consumer/OrderedProductTable"
import { ArrivedProductTable } from "@/components/consumer/ArrivedProductTable"
import BuyerOrderCard from "@/components/tribe_resident/buyer/BuyerOrderCard"
import ConsumerService from '@/services/consumer/consumer'
import UserSrevice from '@/services/user/user'
import { User } from '@/interfaces/user/user';
import { PurchasedProduct } from '@/interfaces/consumer/consumer';
import { Order } from '@/interfaces/tribe_resident/buyer/order';
import { useRouter, useSearchParams } from 'next/navigation'

export default function Page(){
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize defaultTab from URL parameter synchronously
  const initialTab = searchParams.get('tab') === 'pending' ? '未接單' : 'all';
  
  const [user, setUser] = useState<User>()
  const [purchasedItems, setPurchasedItems] = useState<PurchasedProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [viewMode, setViewMode] = useState<'enhanced' | 'legacy'>('enhanced')
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  useEffect(() => {
    const _user = UserSrevice.getLocalStorageUser();
    setUser(_user);
    
    // Check URL parameter for tab selection (update if it changes)
    const tab = searchParams.get('tab');
    if (tab === 'pending') {
      setActiveTab('未接單'); // Set to pending orders tab
    }
    
    if (_user.name === 'empty') {
      router.replace('/login');
    } else {
      // Load both old and new order data
      get_purchased_items(_user);
      fetchBuyerOrders(_user.id);
    }
  }, [router, searchParams]);

  const get_purchased_items = async(user: User) => {
    try {
      const res = await ConsumerService.get_purchased_items(user.id)
      console.log('Legacy purchased items:', res)
      setPurchasedItems(res) 
    }
    catch(e){
      console.log(e)
    }
  }

  // Fetch orders using the new comprehensive system (excludes cancelled by default)
  const fetchBuyerOrders = async (userId: number, includeCancelled: boolean = false) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const url = `/api/orders/buyer/${userId}${includeCancelled ? '?include_cancelled=true' : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const buyerOrders = await response.json();
        console.log('Enhanced order data:', buyerOrders);
        if (includeCancelled) {
          // Separate cancelled orders from active orders
          const active = buyerOrders.filter((order: Order) => order.order_status !== '已取消');
          const cancelled = buyerOrders.filter((order: Order) => order.order_status === '已取消');
          setOrders(active);
          setCancelledOrders(cancelled);
        } else {
          setOrders(buyerOrders);
        }
        setError("");
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

  // Fetch cancelled orders separately when needed
  const fetchCancelledOrders = async (userId: number) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/orders/buyer/${userId}?include_cancelled=true`);
      if (response.ok) {
        const allOrders = await response.json();
        const cancelled = allOrders.filter((order: Order) => order.order_status === '已取消');
        setCancelledOrders(cancelled);
      }
    } catch (error) {
      console.error('Error fetching cancelled orders:', error);
    }
  };

  const refreshOrders = () => {
    if (user && user.id) {
      fetchBuyerOrders(user.id);
      // Also refresh cancelled orders if we're on that tab
      if (activeTab === '已取消') {
        fetchCancelledOrders(user.id);
      }
    }
  };

  // Fetch cancelled orders when "已取消" tab is selected
  useEffect(() => {
    if (activeTab === '已取消' && user && user.id && cancelledOrders.length === 0) {
      fetchCancelledOrders(user.id);
    }
  }, [activeTab, user]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId: number, service: string) => {
    if (!user || !user.id) {
      alert('無法取消訂單：使用者資訊不存在');
      return;
    }

    try {
      const response = await fetch(`/api/orders/${service}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buyer_id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '取消訂單失敗');
      }

      const result = await response.json();
      alert(result.message || '訂單已成功取消');
      
      // Refresh orders after cancellation (fetch all including cancelled)
      await fetchBuyerOrders(user.id, true);
    } catch (error) {
      console.error('Error cancelling order:', error);
      const errorMessage = error instanceof Error ? error.message : '取消訂單失敗，請稍後再試';
      alert(errorMessage);
      throw error; // Re-throw to let BuyerOrderCard handle it
    }
  };

  // Filter orders by status for tabs
  const getOrdersByStatus = (status: string) => {
    if (status === 'all') {
      // Exclude cancelled orders from "全部" tab for better performance
      return orders.filter(order => order.order_status !== '已取消');
    }
    if (status === '已取消') {
      return cancelledOrders;
    }
    if (status === '已完成') {
      // Map '已送達' (delivered) to '已完成' (completed) tab
      return orders.filter(order => order.order_status === '已送達' || order.order_status === '已完成');
    }
    return orders.filter(order => order.order_status === status);
  };

  // Get count for "全部" tab (excluding cancelled)
  const getAllOrdersCount = () => {
    return orders.filter(order => order.order_status !== '已取消').length;
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <UnifiedNavigation title="我的訂單" showBackButton={true} backHref="/consumer" /> 
      
      {/* View Mode Toggle */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'enhanced' ? 'default' : 'outline'}
              onClick={() => setViewMode('enhanced')}
              size="sm"
            >
              🚀 增強版追蹤
            </Button>
            <Button
              variant={viewMode === 'legacy' ? 'default' : 'outline'}
              onClick={() => setViewMode('legacy')}
              size="sm"
            >
              📋 傳統列表
            </Button>
          </div>
          
          {viewMode === 'enhanced' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshOrders}
              disabled={loading}
            >
              {loading ? '🔄 載入中...' : '↻ 重新整理'}
            </Button>
          )}
        </div>

        {/* Enhanced Order Tracking View */}
        {viewMode === 'enhanced' && (
          <div>
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">載入訂單中...</p>
              </div>
            )}

            {/* Enhanced Order Tabs */}
            {!loading && !error && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">全部 ({getAllOrdersCount()})</TabsTrigger>
                  <TabsTrigger value="未接單">⏳ 未接單 ({getOrdersByStatus('未接單').length})</TabsTrigger>
                  <TabsTrigger value="接單">🚚 已接單 ({getOrdersByStatus('接單').length})</TabsTrigger>
                  <TabsTrigger value="配送中">🛣️ 配送中 ({getOrdersByStatus('配送中').length})</TabsTrigger>
                  <TabsTrigger value="已完成">✅ 已完成 ({getOrdersByStatus('已完成').length})</TabsTrigger>
                  <TabsTrigger value="已取消">❌ 已取消 ({cancelledOrders.length})</TabsTrigger>
                </TabsList>

                {/* All Orders (excludes cancelled) */}
                <TabsContent value="all" className="mt-6">
                  {getOrdersByStatus('all').length > 0 ? (
                    <div className="grid gap-6">
                      {getOrdersByStatus('all').map((order) => (
                        <BuyerOrderCard 
                          key={`${order.service}-${order.id}`} 
                          order={order} 
                          onCancel={handleCancelOrder}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-600 text-lg">您還沒有任何訂單</p>
                      <p className="text-blue-500 text-sm mt-2">開始購物來建立您的第一筆訂單吧！</p>
                    </div>
                  )}
                </TabsContent>

                {/* Cancelled Orders Tab */}
                <TabsContent value="已取消" className="mt-6">
                  {cancelledOrders.length > 0 ? (
                    <div className="grid gap-6">
                      {cancelledOrders.map((order) => (
                        <BuyerOrderCard 
                          key={`${order.service}-${order.id}`} 
                          order={order} 
                          onCancel={handleCancelOrder}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-600">沒有已取消的訂單</p>
                    </div>
                  )}
                </TabsContent>

                {/* Status-specific tabs */}
                {['未接單', '接單', '配送中', '已完成'].map((status) => (
                  <TabsContent key={status} value={status} className="mt-6">
                    {getOrdersByStatus(status).length > 0 ? (
                      <div className="grid gap-6">
                        {getOrdersByStatus(status).map((order) => (
                          <BuyerOrderCard 
                            key={`${order.service}-${order.id}`} 
                            order={order} 
                            onCancel={handleCancelOrder}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600">沒有 {status} 的訂單</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        )}

        {/* Legacy Table View */}
        {viewMode === 'legacy' && (
          <Tabs defaultValue="ordered">
            <TabsList className="w-full">
              <TabsTrigger value="ordered" className="w-1/2">待出貨商品</TabsTrigger>
              <TabsTrigger value="arrived" className="w-1/2">待收貨商品</TabsTrigger>
            </TabsList>
            <TabsContent value="ordered" className="justify-items-center text-center" >
              <OrderedProductTable products={purchasedItems.filter((item) => item.status != '已送達' && item.status !='已確認')}/>
            </TabsContent>
            <TabsContent value="arrived" className="justify-items-center text-center">
              <ArrivedProductTable products={purchasedItems.filter((item) => item.status == '已送達')} user={user != undefined?user:{id:0, name:'empty', phone: 'empty', location:'empty',is_driver:false}}/>
            </TabsContent>    
          </Tabs>
        )}
      </div>
    </div>
  )
}