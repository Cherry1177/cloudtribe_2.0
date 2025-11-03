"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order } from '@/interfaces/tribe_resident/buyer/order';
import DriverService from '@/services/driver/driver'
import { TimeSlot } from '@/interfaces/driver/driver'
import { getImageSrc, getFallbackImage } from '@/lib/imageUtils';


/**
 * Represents an order card component.
 * @param {Object} props - The props passed to the component.
 * @param {Order} props.order - The order object containing details of the order.
 * @param {number} props.driverId - The ID of the driver handling the order.
 * @param {Function} props.onAccept - Callback function to accept the order.
 * @param {Function} props.onNavigate - Callback function to navigate to the order's location.
 * @param {Function} props.onComplete - Callback function to mark the order as completed.
 */
const OrderCard: React.FC<{
    order: Order;
    driverId: number;
    onAccept: (orderId: string, service: string) => Promise<void>;
    onComplete: (orderId: string, service: string) => Promise<void>;
    onPickup?: (orderId: string, service: string) => Promise<void>;
    showCompleteButton?: boolean;
    hasOverdueOrders?: boolean;
}> = ({ order, driverId, onAccept, onComplete, onPickup, showCompleteButton, hasOverdueOrders = false }) => {

    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [showExpiryActions, setShowExpiryActions] = useState(false);
    const [selectedExpiryAction, setSelectedExpiryAction] = useState<string>('');
    const [expiryReason, setExpiryReason] = useState<string>('');
    const [showPickupConfirmation, setShowPickupConfirmation] = useState<boolean>(false);
    // State for error messages related to accepting the order
    const [acceptError, setAcceptError] = useState("");
    //state for drop agricultural product(if product is not put in the place that driver takes items)
    const [dropOrderMessage, setDropOrderMessage] = useState("");
    // State for location-based delivery
    const [isCheckingLocation, setIsCheckingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");

    // Calculate time remaining until order expires
    useEffect(() => {
        const calculateTimeRemaining = () => {
            if (!order.timestamp || order.order_status !== '未接單') {
                setTimeRemaining('');
                return;
            }

            const now = new Date();
            const orderTime = new Date(order.timestamp);
            const expiryTime = new Date(orderTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
            const timeDiff = expiryTime.getTime() - now.getTime();

            if (timeDiff <= 0) {
                setTimeRemaining('已過期');
                return;
            }

            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
                setTimeRemaining(`${hours}小時${minutes}分鐘後過期`);
            } else {
                setTimeRemaining(`${minutes}分鐘後過期`);
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [order.timestamp, order.order_status]);

    /**
     * Handle expired product actions
     */
    const handleExpiryAction = async () => {
        if (!selectedExpiryAction) {
            alert('請選擇處理方式');
            return;
        }

        try {
            const response = await fetch(`/api/orders/handle-expired/${order.id}?action=${selectedExpiryAction}&reason=${encodeURIComponent(expiryReason)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to handle expired order');
            }

            const result = await response.json();
            alert(`處理成功: ${result.message}`);
            setShowExpiryActions(false);
            
            // Refresh the page or update the order status
            window.location.reload();
            
        } catch (error) {
            console.error('Error handling expired order:', error);
            alert('處理失敗，請稍後再試');
        }
    };

    /**
     * Geocode an address to get coordinates
     */
    const geocodeAddress = (address: string): Promise<{lat: number, lng: number} | null> => {
        return new Promise((resolve) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve({ lat: location.lat(), lng: location.lng() });
                } else {
                    resolve(null);
                }
            });
        });
    };

    /**
     * Calculate distance between two coordinates in kilometers
     */
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    /**
     * Check if driver is at delivery location
     */
    const checkDeliveryLocation = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setLocationError("此瀏覽器不支援定位功能");
                resolve(false);
                return;
            }

            setIsCheckingLocation(true);
            setLocationError("");

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        
                        // Use Google Maps Geocoding API to get address from coordinates
                        const geocoder = new google.maps.Geocoder();
                        const latlng = { lat: latitude, lng: longitude };
                        
                        geocoder.geocode({ location: latlng }, async (results, status) => {
                            setIsCheckingLocation(false);
                            
                            if (status === 'OK' && results && results[0]) {
                                const currentAddress = results[0].formatted_address;
                                const deliveryLocation = order.location.toLowerCase();
                                
                                // Check if current location matches delivery location
                                // More flexible matching logic
                                const currentLower = currentAddress.toLowerCase();
                                const deliveryLower = deliveryLocation.toLowerCase();
                                
                                // Extract key parts of addresses for comparison
                                const extractKeywords = (addr: string) => {
                                    return addr.split(/[,，\s]+/).filter(part => part.length > 1);
                                };
                                
                                const currentKeywords = extractKeywords(currentLower);
                                const deliveryKeywords = extractKeywords(deliveryLower);
                                
                                // Check for matches in key address components
                                const hasMatch = deliveryKeywords.some(keyword => 
                                    currentKeywords.some(current => 
                                        current.includes(keyword) || keyword.includes(current)
                                    )
                                );
                                
                                // Also check distance-based matching (within 100 meters)
                                const deliveryCoords = await geocodeAddress(order.location);
                                let isNearby = false;
                                
                                if (deliveryCoords) {
                                    const distance = calculateDistance(
                                        latitude, longitude,
                                        deliveryCoords.lat, deliveryCoords.lng
                                    );
                                    isNearby = distance <= 0.1; // Within 100 meters
                                }
                                
                                const isAtLocation = hasMatch || isNearby;
                                
                                if (!isAtLocation) {
                                    setLocationError(`您目前在：${currentAddress}\n配送地點：${order.location}\n請確認您已到達配送地點`);
                                    console.log('Location verification failed:', {
                                        currentAddress,
                                        deliveryLocation: order.location,
                                        hasMatch,
                                        isNearby,
                                        currentKeywords,
                                        deliveryKeywords
                                    });
                                } else {
                                    console.log('Location verification passed:', {
                                        currentAddress,
                                        deliveryLocation: order.location,
                                        hasMatch,
                                        isNearby
                                    });
                                }
                                
                                resolve(isAtLocation);
                            } else {
                                setLocationError("無法取得位置資訊，請稍後再試");
                                resolve(false);
                            }
                        });
                        
                    } catch (error) {
                        setIsCheckingLocation(false);
                        setLocationError("定位失敗，請稍後再試");
                        resolve(false);
                    }
                },
                (error) => {
                    setIsCheckingLocation(false);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            setLocationError("請允許定位權限以完成配送");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            setLocationError("無法取得位置資訊");
                            break;
                        case error.TIMEOUT:
                            setLocationError("定位超時，請稍後再試");
                            break;
                        default:
                            setLocationError("定位失敗，請稍後再試");
                            break;
                    }
                    resolve(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    };

    /**
     * Handle delivery completion with location check
     */
    const handleCompleteWithLocationCheck = async () => {
        const isAtLocation = await checkDeliveryLocation();
        
        if (isAtLocation) {
            try {
                await onComplete(order.id?.toString() || '', order.service);
                alert('配送完成！');
            } catch (error) {
                console.error('Error completing order:', error);
                alert('完成配送失敗，請稍後再試');
                throw error; // Re-throw to let parent handle the error
            }
        } else {
            // Show location error - user needs to be at delivery location
            const errorMessage = locationError || "請確認您已到達配送地點再完成配送";
            alert(errorMessage);
            throw new Error(errorMessage); // Throw error to prevent order removal
        }
    };

    /**
     * Handle pickup confirmation
     */
    const handlePickupConfirmation = async () => {
        try {
            if (onPickup) {
                await onPickup(order.id?.toString() || '', order.service);
            } else {
                const response = await fetch(`/api/orders/${order.service}/${order.id}/pickup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to confirm pickup');
                }
            }

            alert('已確認取貨！開始配送');
            setShowPickupConfirmation(false);
            // Note: Order status will be updated by parent component, no need to reload
            // The card may disappear from "接單" tab view as it moves to "配送中" status
            
            // Automatically navigate to delivery location after confirming pickup
            if (order.id && driverId && order.location) {
                // Wait a moment for the status update to complete
                setTimeout(() => {
                    const navUrl = `/navigation?orderId=${order.id}&driverId=${driverId}&destination=${encodeURIComponent(order.location)}`;
                    window.open(navUrl, '_blank');
                }, 500);
            }
            
        } catch (error) {
            console.error('Error confirming pickup:', error);
            alert('確認取貨失敗，請稍後再試');
        }
    };

    /**
     * Handle navigation to delivery location
     */
    const handleStartNavigation = () => {
        if (order.id && driverId) {
            // Create a comprehensive navigation URL with all necessary parameters
            const navUrl = `/navigation?orderId=${order.id}&driverId=${driverId}&destination=${encodeURIComponent(order.location)}`;
            
            // Open navigation in a new tab/window
            window.open(navUrl, '_blank');
            
            // Log navigation start for tracking
            console.log(`Starting navigation for order ${order.id} to ${order.location}`);
        } else {
            alert('導航資訊不完整，請稍後再試');
        }
    };

    /**
     * Handles the acceptance of an order.
     */
    const handleAccept = async () => {
        try {
            if (order.id) {
                await onAccept(order.id.toString(), order.service);
                setAcceptError(""); // Clear any previous errors
            } else {
                setAcceptError("order ID not exist");
            }
        } catch (error: any) {
            // Handle errors and set an appropriate error message
            let errorMessage = "接單失敗，訂單已被接走";
            
            if (error?.message) {
                if (error.message.includes('無法接取自己的訂單')) {
                    errorMessage = '無法接取自己的訂單';
                } else if (error.message.includes('已被接')) {
                    errorMessage = '訂單已被其他司機接走';
                } else if (error.message.includes('訂單未找到')) {
                    errorMessage = '訂單不存在';
                } else if (error.response && error.response.data?.detail) {
                    errorMessage = error.response.data.detail;
                }
            }
            
            setAcceptError(errorMessage);
        }
    };



    const handleDropOrder = async() => {
        let today = new Date().toLocaleDateString('zh-TW', {
            timeZone: 'Asia/Taipei',
        });
        today = today.replace(/\//g,'-')
        //const today = new Date().toISOString().split('T')[0] // 非台灣時間
        try{
            const res_driver_times: TimeSlot[] = await DriverService.get_specific_driver_times(driverId)
            console.log(res_driver_times)
            if(res_driver_times.length == 0){
                setDropOrderMessage('請先填寫可運送時間才可棄單')
            }
            else if(res_driver_times.some(slot => slot.date === today) != true){
                setDropOrderMessage('今天非運送日期無法棄單')
            }
            else if(order.is_put == true) {
                setDropOrderMessage('商品已送達運送地無法棄單')
            }
            else {
                try {
                    if(order.id != undefined) 
                        var res_delete = await DriverService.drop_agricultural_order(driverId, order.id)
                        console.log(res_delete)
                }
                catch(e){
                    console.log(e)
                }
                setDropOrderMessage('棄單成功!')
            }       
        }
        catch(e){
            console.log(e)
        }

    }

    // Use standardized image handling from utils



    return (
        <Card 
            className={`max-w-md mx-auto my-6 shadow-lg ${
                order.is_urgent ? 'border-2 border-black-500' : ''
            }`}
        >
            {/* Card header displaying order type and buyer's name */}
            <CardHeader className="bg-black text-white p-4 rounded-t-md flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    {order.is_urgent && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 ">
                            急件
                        </span>
                    )}
                    <div>
                        <CardTitle className="text-lg font-bold">{order.order_type}</CardTitle>
                        <CardDescription className="text-lg text-white font-semibold">消費者姓名: {order.buyer_name}</CardDescription>
                        {timeRemaining && order.order_status === '未接單' && (
                            <div className={`text-sm mt-1 font-medium ${
                                timeRemaining.includes('已過期') ? 'text-red-300' :
                                timeRemaining.includes('分鐘') && !timeRemaining.includes('小時') ? 'text-yellow-300' :
                                'text-green-300'
                            }`}>
                                ⏰ {timeRemaining}
                            </div>
                        )}
                    </div>
                </div>
                {order.order_status === '配送中' && showCompleteButton && (
                <div>
                <Button
                    className="bg-white text-black border border-black hover:text-black hover:bg-white transition-all duration-300"
                    onClick={() => {
                        const confirmedFirst = window.confirm("請確認該訂單貨物已到達目的地，確定要完成訂單？");
                        if (!confirmedFirst) return;
                        const confirmedSecond = window.confirm("確認後將無法更改，確定要完成訂單？");
                        if (confirmedSecond) {
                            handleCompleteWithLocationCheck();
                        }
                    }}
                    disabled={isCheckingLocation}
                >
                    {isCheckingLocation ? "🌍 檢查位置中..." : "各別訂單物品已到達目的地"}
                </Button>
                {locationError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {locationError}
                    </div>
                )}
            </div>
            )}  
            </CardHeader>
            <CardContent className="p-4">
                {/* Order details including buyer phone, date, time, and location */}
                <div className="mb-2">
                    {order.order_status !== '未接單' && (
                        <p className="text-sm text-gray-700 font-bold">聯絡電話: {order.buyer_phone}</p>
                    )}
                    <p className="text-sm text-gray-700 font-bold">下單時間: {order.timestamp?.split('.')[0].replace('T', ' ')}</p>
                    <p className="text-sm text-gray-700 font-bold">送達地點: {order.location}</p>
                    
                </div>
                {/* List of items in the order */}
                <div className="mb-2">
                    <p className="text-sm text-gray-700 font-bold">商品:</p>
                    <ul className="list-disc list-inside ml-4">
                        {order.items.map((item) => (
                            <li key={item.item_id} className="text-sm text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                <img
                                    src={getImageSrc(item)}
                                    alt={item.item_name || '未命名'} 
                                    width={40} 
                                    height={40} 
                                    className="object-cover rounded"
                                    onLoad={() => {
                                        console.log('Image loaded successfully:', getImageSrc(item), 'for item:', item.item_name);
                                    }}
                                    onError={(e) => {
                                        console.log('Image failed to load:', getImageSrc(item), 'for item:', item.item_name);
                                        const target = e.target as HTMLImageElement;
                                        const fallbackSrc = getFallbackImage(item);
                                        console.log('Using fallback image:', fallbackSrc);
                                        target.src = fallbackSrc; // Category-based fallback image
                                    }}
                                />
                                    <div>
                                        {/* Display item name, location, price, and quantity */}
                                        <span className="block font-semibold text-black truncate" style={{ maxWidth: '20rem' }}>
                                            {item.item_name || '未命名'}
                                        </span>
                                        <span className="block font-semibold text-black truncate" style={{ maxWidth: '20rem' }}>
                                            地點: {item.location || '未命名'}
                                        </span>
                                        <span className="block">- {item.price} 元 x {item.quantity} = {item.quantity * item.price} 元</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Additional notes for the order, if any */}
                {order.note && (
                    <p className="text-sm text-gray-700 font-bold">備註: {order.note}</p>
                )}
                {acceptError && (
                    <p className="text-red-600 mt-2">{acceptError}</p>
                )}
                {dropOrderMessage && (
                    <p className="text-red-600 mt-2">{dropOrderMessage}</p>
                )}

                {/* Expiry handling form */}
                {showExpiryActions && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-bold text-gray-800 mb-3">🕒 產品過期處理</h4>
                        <p className="text-sm text-gray-600 mb-3">請選擇如何處理已過期的產品：</p>
                        
                        <div className="space-y-2 mb-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="expiryAction"
                                    value="return_to_seller"
                                    onChange={(e) => setSelectedExpiryAction(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">🔄 退回賣家（賣家負責處理）</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="expiryAction"
                                    value="dispose"
                                    onChange={(e) => setSelectedExpiryAction(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">🗑️ 丟棄處理（退款給客戶）</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="expiryAction"
                                    value="donate"
                                    onChange={(e) => setSelectedExpiryAction(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">❤️ 捐贈給需要的人（退款給客戶）</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="expiryAction"
                                    value="customer_still_wants"
                                    onChange={(e) => setSelectedExpiryAction(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">✅ 客戶仍要收貨（已聯繫確認）</span>
                            </label>
                        </div>

                        <Input
                            type="text"
                            value={expiryReason}
                            onChange={(e) => setExpiryReason(e.target.value)}
                            placeholder="請說明處理原因或備註"
                            className="mb-3"
                        />

                        <div className="flex space-x-2">
                            <Button 
                                className="bg-orange-500 text-white hover:bg-orange-600" 
                                onClick={handleExpiryAction}
                            >
                                確認處理
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setShowExpiryActions(false)}
                            >
                                取消
                            </Button>
                        </div>
                    </div>
                )}

                {/* Pickup confirmation dialog */}
                {showPickupConfirmation && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-bold text-gray-800 mb-3">📦 確認取貨</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            請確認您已到達取貨地點並收取所有商品：
                        </p>
                        
                        <div className="mb-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">取貨清單：</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                                {order.items?.map((item, index) => (
                                    <li key={index} className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <span>• {item.item_name}</span>
                                            <span className="block text-gray-500 text-xs mt-0.5">
                                                📍 地點: {item.location || '未指定地點'}
                                            </span>
                                        </div>
                                        <span className="ml-2">數量: {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Show unique pickup locations */}
                        {(() => {
                            const pickupLocations = new Set<string>();
                            order.items?.forEach(item => {
                                if (item.location && item.location.trim() && item.location !== order.location) {
                                    pickupLocations.add(item.location.trim());
                                }
                            });
                            
                            if (pickupLocations.size > 0) {
                                return (
                                    <div className="text-sm text-gray-600 mb-4">
                                        <strong>取貨地點:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            {Array.from(pickupLocations).map((location, idx) => (
                                                <li key={idx} className="text-xs">{location}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            }
                            return (
                                <div className="text-sm text-gray-600 mb-4">
                                    <strong>取貨地點:</strong> <span className="text-gray-500">未指定取貨地點</span>
                                </div>
                            );
                        })()}

                        <div className="flex space-x-2">
                            <Button 
                                className="bg-green-600 text-white hover:bg-green-700" 
                                onClick={handlePickupConfirmation}
                            >
                                ✅ 已取貨，開始配送
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setShowPickupConfirmation(false)}
                            >
                                取消
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            {/* Card footer showing order status and total price */}
            <CardFooter className="bg-gray-100 p-4 rounded-b-md flex justify-between items-center">
                <div className="flex flex-col items-start">
                    <p className="text-sm text-gray-700 font-bold">訂單狀態: {order.order_status}</p>
                    <p className="text-sm text-gray-700 font-bold">總價格: {order.total_price} 元</p>
                </div>
                {/* Action buttons for accepting or navigating to the order */}
                {order.order_status !== '已完成' && (
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {order.order_status === '未接單' ? (
                                <Button 
                                    className="bg-black text-white" 
                                    onClick={handleAccept}
                                    disabled={hasOverdueOrders}
                                    title={hasOverdueOrders ? "您有逾期訂單，請先完成已接受的訂單" : ""}
                                >
                                    接單
                                </Button>
                            ) : order.order_status === '配送逾時' ? (
                                <Button 
                                    className="bg-orange-500 text-white" 
                                    onClick={() => setShowExpiryActions(true)}
                                >
                                    🕒 處理過期產品
                                </Button>
                            ) : order.order_status === '接單' ? (
                                // Workflow for accepted orders
                                <>
                                    <Button 
                                        className="bg-green-600 text-white hover:bg-green-700" 
                                        onClick={() => setShowPickupConfirmation(true)}
                                    >
                                        📦 確認取貨
                                    </Button>
                                    <Button 
                                        className="bg-blue-600 text-white hover:bg-blue-700" 
                                        onClick={handleStartNavigation}
                                    >
                                        🧭 開始導航
                                    </Button>
                                </>
                            ) : order.order_status === '配送中' ? (
                                // Workflow for orders being delivered
                                <>
                                    <Button 
                                        className="bg-blue-600 text-white hover:bg-blue-700" 
                                        onClick={handleStartNavigation}
                                    >
                                        🧭 繼續導航
                                    </Button>
                                    <Button 
                                        className="bg-green-600 text-white hover:bg-green-700" 
                                        onClick={() => {
                                            const confirmed = window.confirm("確認已送達客戶手中？");
                                            if (confirmed && order.id) {
                                                handleCompleteWithLocationCheck();
                                            }
                                        }}
                                        disabled={isCheckingLocation}
                                    >
                                        {isCheckingLocation ? "🌍 檢查位置中..." : "✅ 確認送達"}
                                    </Button>
                                </>
                            ) : (
                                // Default actions for other statuses
                                <>
                                    {order.service == 'agricultural_product' &&
                                        <Button className="bg-black text-white" onClick={handleDropOrder}>棄單</Button>}
                                </>
                            )}
                        </div>
                        
                        {/* Show expiry warning for accepted orders approaching expiry */}
                        {order.order_status === '接單' && timeRemaining && timeRemaining.includes('分鐘') && !timeRemaining.includes('小時') && (
                            <Button 
                                variant="outline"
                                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                onClick={() => setShowExpiryActions(true)}
                            >
                                ⚠️ 即將過期 - 預先處理
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default OrderCard;
