'use client';

import { useState, useEffect } from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: number;
  original_id: string; // Store the original ID from API
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  order_date: string;
  delivery_date: string;
  location: string;
  order_type?: string; // Add order type
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const sellerId = 1; // TODO: Get from user context or authentication
        const response = await fetch(`/api/orders/seller/${sellerId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('賣家不存在');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received orders from API:', data.map((o: any) => ({ id: o.id, status: o.status, order_type: o.order_type })));
        
        // Transform the API data to match the frontend interface
        const transformedOrders: Order[] = data.map((order: any) => ({
          id: typeof order.id === 'string' ? parseInt(order.id.replace('agri_', '')) : order.id,
          original_id: order.id, // Store the original ID
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          product_name: order.product_name,
          quantity: order.quantity,
          total_price: order.total_price,
          status: mapOrderStatus(order.status),
          order_date: order.order_date,
          delivery_date: order.delivery_date,
          location: order.location,
          order_type: order.order_type
        }));
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : '載入訂單時發生錯誤');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Map database order status to frontend status
  const mapOrderStatus = (dbStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      '未接單': 'pending',
      '接單': 'preparing',        // Handle both with and without 已
      '已接單': 'preparing', 
      '準備中': 'preparing',
      '準備完成': 'ready',
      '已配送': 'delivered',
      '配送': 'delivered',        // Handle both with and without 已
      '已完成': 'delivered'
    };
    return statusMap[dbStatus] || 'pending';
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待處理', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'preparing':
        return { label: '準備中', color: 'bg-blue-100 text-blue-800', icon: Package };
      case 'ready':
        return { label: '準備完成', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'delivered':
        return { label: '已配送', color: 'bg-gray-100 text-gray-800', icon: Truck };
      default:
        return { label: '未知', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const filteredOrders = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });
      
      // Map frontend status to database status
      const statusMap: { [key: string]: string } = {
        'pending': '未接單',
        'preparing': '已接單',
        'ready': '準備完成',
        'delivered': '已配送'
      };
      
      const dbStatus = statusMap[newStatus] || newStatus;
      console.log('Mapped to database status:', dbStatus);
      
      // Find the order and use its original ID
      const originalOrder = orders.find(order => order.id === orderId);
      if (!originalOrder) {
        throw new Error('訂單不存在');
      }
      
      console.log('Found order:', { original_id: originalOrder.original_id, current_status: originalOrder.status });
      
      // Use the original ID from the API
      const apiOrderId = originalOrder.original_id;
      
      // Update the order status in the database
      const response = await fetch(`/api/orders/${apiOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          order_status: dbStatus 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '更新訂單狀態失敗');
      }

      const result = await response.json();
      console.log('Order status updated successfully:', result);

      // Update the local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));
      
      // Refresh orders from server to ensure consistency
      setTimeout(() => {
        window.location.reload(); // Simple refresh for now
      }, 500);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : '更新訂單狀態時發生錯誤');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <NavigationBar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link href="/seller_options">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回賣家選項
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">訂單管理中心</h1>
          <p className="text-blue-100 text-lg">管理您的訂單狀態，提供優質的客戶服務</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">待處理</p>
                  <p className="text-2xl font-bold text-yellow-600">{filteredOrders('pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">準備中</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredOrders('preparing').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">準備完成</p>
                  <p className="text-2xl font-bold text-green-600">{filteredOrders('ready').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="w-8 h-8 text-gray-600 mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">已配送</p>
                  <p className="text-2xl font-bold text-gray-600">{filteredOrders('delivered').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">待處理 ({filteredOrders('pending').length})</TabsTrigger>
            <TabsTrigger value="preparing">準備中 ({filteredOrders('preparing').length})</TabsTrigger>
            <TabsTrigger value="ready">準備完成 ({filteredOrders('ready').length})</TabsTrigger>
            <TabsTrigger value="delivered">已配送 ({filteredOrders('delivered').length})</TabsTrigger>
          </TabsList>

          {['pending', 'preparing', 'ready', 'delivered'].map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              <div className="space-y-4">
                {filteredOrders(status).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">暫無{getStatusInfo(status).label}訂單</h3>
                      <p className="text-gray-500">當有新訂單時，會顯示在這裡</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredOrders(status).map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <Card key={order.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-4">
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                                <span className="text-sm text-gray-500">訂單 #{order.id}</span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">{order.product_name}</h3>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>客戶：</strong>{order.customer_name}</p>
                                    <p><strong>電話：</strong>{order.customer_phone}</p>
                                    <p><strong>數量：</strong>{order.quantity} 件</p>
                                    <p><strong>總價：</strong>NT$ {order.total_price}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600">
                                  <p><strong>訂單日期：</strong>{order.order_date}</p>
                                  <p><strong>配送日期：</strong>{order.delivery_date}</p>
                                  <p><strong>配送地址：</strong>{order.location}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 ml-4">
                              {order.status === 'pending' && (
                                <Button 
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Package className="w-4 h-4 mr-2" />
                                  開始準備
                                </Button>
                              )}
                              {order.status === 'preparing' && (
                                <Button 
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  準備完成
                                </Button>
                              )}
                              {order.status === 'ready' && (
                                <Button 
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  className="bg-gray-600 hover:bg-gray-700"
                                >
                                  <Truck className="w-4 h-4 mr-2" />
                                  標記已配送
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
