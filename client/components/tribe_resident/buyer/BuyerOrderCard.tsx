"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order } from '@/interfaces/tribe_resident/buyer/order';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image';
import { getImageSrc, getFallbackImage } from '@/lib/imageUtils';

/**
 * A functional component that displays a comprehensive order card for buyers with real-time tracking.
 * @param {Object} props - The properties passed to the component.
 * @param {Object} props.order - The order object containing details such as date, time, location, items, and order status.
 */
const BuyerOrderCard: React.FC<{
  order: Order; // The order object
  onCancel?: (orderId: number, service: string) => Promise<void>; // Callback for order cancellation
}> = ({ order, onCancel }) => {
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Get image source with error handling
  const getItemImageSrc = (item: any) => {
    const itemKey = `${item.item_id}_${item.img}`;
    if (imageErrors.has(itemKey)) {
      return getFallbackImage(item);
    }
    return getImageSrc(item);
  };

  // Handle image load errors
  const handleImageError = (item: any) => {
    const itemKey = `${item.item_id}_${item.img}`;
    setImageErrors(prev => new Set([...prev, itemKey]));
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case '未接單':
        return { 
          color: 'bg-yellow-500', 
          icon: '⏳', 
          text: '等待司機接單',
          description: '您的訂單正在等待司機接單中...'
        };
      case '接單':
        return { 
          color: 'bg-blue-500', 
          icon: '🚚', 
          text: '司機已接單',
          description: '司機正在前往取貨地點'
        };
      case '配送中':
        return { 
          color: 'bg-purple-500', 
          icon: '🛣️', 
          text: '配送中',
          description: '司機已取貨，正在配送途中'
        };
      case '已送達':
      case '已完成':
        return { 
          color: 'bg-green-500', 
          icon: '✅', 
          text: '已送達',
          description: '訂單已成功送達！'
        };
      case '已過期':
        return { 
          color: 'bg-red-500', 
          icon: '❌', 
          text: '已過期',
          description: '訂單超過時限，已自動過期'
        };
      case '配送逾時':
        return { 
          color: 'bg-orange-500', 
          icon: '⚠️', 
          text: '配送逾時',
          description: '配送時間較長，司機正在處理中'
        };
      case '已取消':
        return { 
          color: 'bg-red-600', 
          icon: '❌', 
          text: '已取消',
          description: '此訂單已被取消'
        };
      default:
        return { 
          color: 'bg-gray-500', 
          icon: '❓', 
          text: status,
          description: '訂單狀態更新中...'
        };
    }
  };

  // Fetch driver information when order is accepted
  useEffect(() => {
    const fetchDriverInfo = async () => {
      if (currentOrder.order_status === '接單' || currentOrder.order_status === '配送中' || currentOrder.order_status === '已送達') {
        try {
          // Get driver info from driver_orders table
          const response = await fetch(`/api/orders/${currentOrder.id}/driver-info`);
          if (response.ok) {
            const driverData = await response.json();
            setDriverInfo(driverData);
          }
        } catch (error) {
          console.error('Error fetching driver info:', error);
        }
      }
    };

    fetchDriverInfo();
  }, [currentOrder.order_status, currentOrder.id]);

  // Refresh order status
  const refreshOrderStatus = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`);
      if (response.ok) {
        const updatedOrder = await response.json();
        setCurrentOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!onCancel) return;
    
    const confirmed = window.confirm(
      currentOrder.order_status === '接單'
        ? '確定要取消此訂單嗎？司機已經接單，取消後司機將會收到通知。'
        : '確定要取消此訂單嗎？'
    );
    
    if (!confirmed) return;
    
    setIsCancelling(true);
    try {
      await onCancel(currentOrder.id || 0, currentOrder.service || 'necessities');
      // Refresh order after cancellation
      await refreshOrderStatus();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('取消訂單失敗，請稍後再試');
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if order can be cancelled
  const canCancel = (currentOrder.order_status === '未接單' || currentOrder.order_status === '接單') && onCancel;

  const statusInfo = getStatusInfo(currentOrder.order_status);

  return (
    <Card className="max-w-md mx-auto my-6 shadow-lg border-l-4" style={{ borderLeftColor: statusInfo.color.replace('bg-', '') }}>
      {/* Header with order status and refresh */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentOrder.is_urgent && (
              <Badge className="bg-red-500 text-white">
                急件
              </Badge>
            )}
            <CardTitle className="text-lg font-bold">訂單 #{currentOrder.id}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshOrderStatus}
            disabled={refreshing}
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            {refreshing ? '🔄' : '↻'}
          </Button>
        </div>
      </CardHeader>

      {/* Order Status Alert */}
      <div className="p-4 pb-2">
        <Alert className={`${statusInfo.color} text-white border-0`}>
          <AlertDescription className="flex items-center space-x-2">
            <span className="text-xl">{statusInfo.icon}</span>
            <div>
              <div className="font-bold">{statusInfo.text}</div>
              <div className="text-sm opacity-90">{statusInfo.description}</div>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Driver Information */}
      {driverInfo && (currentOrder.order_status === '接單' || currentOrder.order_status === '配送中' || currentOrder.order_status === '已送達') && (
        <div className="px-4 pb-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-blue-800">👤 司機資訊</h4>
              {(currentOrder.order_status === '接單' || currentOrder.order_status === '配送中') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    // Open navigation page with driver tracking
                    const trackingUrl = `/navigation?orderId=${currentOrder.id}&driverId=${driverInfo.driver_id}&trackDriver=true&destination=${encodeURIComponent(currentOrder.location || '')}`;
                    window.open(trackingUrl, '_blank');
                  }}
                >
                  🗺️ 追蹤司機
                </Button>
              )}
            </div>
            <div className="text-sm text-blue-700">
              <p><strong>姓名:</strong> {driverInfo.driver_name}</p>
              <p><strong>電話:</strong> {driverInfo.driver_phone}</p>
              {driverInfo.driver_location && (
                <p><strong>司機位置:</strong> {driverInfo.driver_location}</p>
              )}
              {currentOrder.order_status === '接單' && (
                <div className="mt-2 flex items-center text-blue-600">
                  <span className="animate-pulse mr-1">🚗</span>
                  <span className="font-medium">司機準備中...</span>
                </div>
              )}
              {currentOrder.order_status === '配送中' && (
                <div className="mt-2 flex items-center text-green-600">
                  <span className="animate-pulse mr-1">🚚</span>
                  <span className="font-medium">正在配送中...</span>
                </div>
              )}
              {currentOrder.order_status === '已送達' && (
                <div className="mt-2 flex items-center text-green-600">
                  <span className="mr-1">✅</span>
                  <span className="font-medium">已成功送達！</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content section showing order details */}
      <CardContent className="p-4 pt-2">
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600">下單時間</p>
              <p className="font-semibold">{currentOrder.timestamp?.split('.')[0].replace('T', ' ')}</p>
            </div>
            <div>
              <p className="text-gray-600">送達地點</p>
              <p className="font-semibold text-blue-600">{currentOrder.location}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm text-gray-600 mb-2">📦 商品清單</h4>
          <div className="space-y-2">
            {currentOrder.items.map((item: any) => (
              <div key={item.item_id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-lg">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={getItemImageSrc(item)}
                    alt={item.item_name || '未命名'}
                    width={40}
                    height={40}
                    className="object-cover rounded"
                    onError={() => handleImageError(item)}
                    unoptimized={true}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {item.item_name || '未命名'}
                  </p>
                  <p className="text-xs text-gray-600">
                    取貨地點: {item.location || '未命名'}
                  </p>
                  {/* Display customization options */}
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {Object.entries(item.selectedOptions).map(([key, values]) => {
                        // Check if values is empty (handles both array and string cases)
                        const isEmpty = !values || (Array.isArray(values) && values.length === 0) || (typeof values === 'string' && values.trim().length === 0);
                        if (isEmpty) return null;
                        
                        // Ensure values is a valid type (string or string[])
                        if (typeof values !== 'string' && !Array.isArray(values)) return null;
                        
                        const labelMap: Record<string, string> = {
                          'ice': '冰度',
                          'sweetness': '甜度',
                          'sauce': '醬料',
                          '甜度': '甜度',
                          '冰度': '冰度',
                          '醬料': '醬料'
                        };
                        const label = labelMap[key] || key;
                        const displayValue = Array.isArray(values) ? values.join('、') : String(values);
                        return (
                          <span key={key} className="block">
                            {label}：{displayValue}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-green-600 font-medium">
                    ${item.price} × {item.quantity} = ${item.quantity * item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display order note if present */}
        {currentOrder.note && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">📝 備註</p>
            <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">{currentOrder.note}</p>
          </div>
        )}
      </CardContent>

      {/* Footer section showing total price */}
      <CardFooter className="bg-gray-50 p-4 rounded-b-md">
        <div className="w-full flex flex-col space-y-2">
          <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-green-600">
            總金額: ${currentOrder.total_price}
          </div>
          {currentOrder.order_status === '未接單' && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              等待接單中...
            </Badge>
            )}
          </div>
          {/* Cancel button */}
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="w-full"
            >
              {isCancelling ? '取消中...' : '❌ 取消訂單'}
            </Button>
          )}
          {currentOrder.order_status === '配送中' && (
            <p className="text-xs text-gray-500 text-center">
              司機已取貨，無法取消訂單
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BuyerOrderCard;
