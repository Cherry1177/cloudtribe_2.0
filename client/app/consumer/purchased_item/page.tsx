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
import { useRouter } from 'next/navigation'

export default function Page(){
  const [user, setUser] = useState<User>()
  const [purchasedItems, setPurchasedItems] = useState<PurchasedProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [viewMode, setViewMode] = useState<'enhanced' | 'legacy'>('enhanced')
  const router = useRouter()

  useEffect(() => {
    const _user = UserSrevice.getLocalStorageUser();
    setUser(_user);
    if (_user.name === 'empty') {
      router.replace('/login');
    } else {
      // Load both old and new order data
      get_purchased_items(_user);
      fetchBuyerOrders(_user.id);
    }
  }, [router]);

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

  // Fetch orders using the new comprehensive system
  const fetchBuyerOrders = async (userId: number) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/buyer/${userId}`);
      if (response.ok) {
        const buyerOrders = await response.json();
        console.log('Enhanced order data:', buyerOrders);
        setOrders(buyerOrders);
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

  const refreshOrders = () => {
    if (user && user.id) {
      fetchBuyerOrders(user.id);
    }
  };

  // Filter orders by status for tabs
  const getOrdersByStatus = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.order_status === status);
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
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">全部 ({orders.length})</TabsTrigger>
                  <TabsTrigger value="未接單">⏳ 未接單 ({getOrdersByStatus('未接單').length})</TabsTrigger>
                  <TabsTrigger value="接單">🚚 已接單 ({getOrdersByStatus('接單').length})</TabsTrigger>
                  <TabsTrigger value="配送中">🛣️ 配送中 ({getOrdersByStatus('配送中').length})</TabsTrigger>
                  <TabsTrigger value="已完成">✅ 已完成 ({getOrdersByStatus('已完成').length})</TabsTrigger>
                </TabsList>

                {/* All Orders */}
                <TabsContent value="all" className="mt-6">
                  {orders.length > 0 ? (
                    <div className="grid gap-6">
                      {orders.map((order) => (
                        <BuyerOrderCard key={`${order.service}-${order.id}`} order={order} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-600 text-lg">您還沒有任何訂單</p>
                      <p className="text-blue-500 text-sm mt-2">開始購物來建立您的第一筆訂單吧！</p>
                    </div>
                  )}
                </TabsContent>

                {/* Status-specific tabs */}
                {['未接單', '接單', '配送中', '已完成'].map((status) => (
                  <TabsContent key={status} value={status} className="mt-6">
                    {getOrdersByStatus(status).length > 0 ? (
                      <div className="grid gap-6">
                        {getOrdersByStatus(status).map((order) => (
                          <BuyerOrderCard key={`${order.service}-${order.id}`} order={order} />
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