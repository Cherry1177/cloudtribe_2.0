"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order } from '@/interfaces/tribe_resident/buyer/order';
import DriverService from '@/services/driver/driver'
import { TimeSlot } from '@/interfaces/driver/driver'


/**
 * Represents an order card component.
 * @param {Object} props - The props passed to the component.
 * @param {Order} props.order - The order object containing details of the order.
 * @param {number} props.driverId - The ID of the driver handling the order.
 * @param {Function} props.onAccept - Callback function to accept the order.
 * @param {Function} props.onTransfer - Callback function to transfer the order to a new driver.
 * @param {Function} props.onNavigate - Callback function to navigate to the order's location.
 * @param {Function} props.onComplete - Callback function to mark the order as completed.
 */
const OrderCard: React.FC<{
    order: Order;
    driverId: number;
    onAccept: (orderId: string, service: string) => Promise<void>;
    onTransfer: (orderId: string, newDriverPhone: string) => Promise<void>;
    onComplete: (orderId: string, service: string) => Promise<void>;
    showCompleteButton?: boolean;
}> = ({ order, driverId, onAccept, onTransfer, onComplete,showCompleteButton }) => {

    // State for managing the visibility of the transfer form
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [showExpiryActions, setShowExpiryActions] = useState(false);
    const [selectedExpiryAction, setSelectedExpiryAction] = useState<string>('');
    const [expiryReason, setExpiryReason] = useState<string>('');
    const [showPickupConfirmation, setShowPickupConfirmation] = useState<boolean>(false);
    // State for the new driver's phone number input
    const [newDriverPhone, setNewDriverPhone] = useState("");
    // State for error messages related to transfer operations
    const [transferError, setTransferError] = useState("");
    // State for error messages related to accepting the order
    const [acceptError, setAcceptError] = useState("");
    //state for drop agricultural product(if product is not put in the place that driver takes items)
    const [dropOrderMessage, setDropOrderMessage] = useState("");

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
     * Handle pickup confirmation
     */
    const handlePickupConfirmation = async () => {
        try {
            const response = await fetch(`/api/orders/${order.service}/${order.id}/pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to confirm pickup');
            }

            alert('已確認取貨！開始配送');
            setShowPickupConfirmation(false);
            // Refresh the page to update order status
            window.location.reload();
            
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
            if (error.response && error.response.data.detail) {
                setAcceptError(error.response.data.detail);
            } else {
                setAcceptError("接單失敗，訂單已被接走");
            }
        }
    };

    /**
     * Handles the transfer of an order to a new driver.
     */
    const handleTransfer = async () => {
        if (/^\d{7,10}$/.test(newDriverPhone)) {
            const confirmedFirst = window.confirm("請確認新司機電話號碼無誤，確定要轉單？");
            if (!confirmedFirst) return;
      
            const confirmedSecond = window.confirm("轉單後將無法撤回，確定要轉單？");
            if (!confirmedSecond) return;
    
            try {
                await onTransfer(order.id?.toString() || "", newDriverPhone);
                setTransferError("");
                setShowTransferForm(false);
            } catch (err: Error | any) {
                console.error('轉單錯誤，請重新整理頁面讓表單出現：', err);
                setTransferError(err.message);
            }
        } else {
            setTransferError("電話號碼必須是7到10位的數字");
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

    const getImageSrc = (item: any) => {
        console.log('Getting image src for item:', item);
        let imageSrc;
        if (item.category === "小木屋鬆餅" || item.category === "金鰭" || item.category === "原丼力") {
            imageSrc = `/test/${encodeURIComponent(item.img)}`; // Local image
        } else if (item.img?.includes('imgur.com') || item.img?.includes('ibb.co')) {
            imageSrc = item.img; // Imgur/ImgBB image - direct URL
        } else if (item.img?.startsWith('http')) {
            imageSrc = item.img; // Any other HTTP URL
        } else if (item.img?.startsWith('/external-image/')) {
            // For Carrefour external images, try the direct URL first
            imageSrc = `https://www.carrefour.com.tw${item.img}`; // Try Carrefour URL first
        } else {
            imageSrc = `https://www.cloudtribe.site${item.img}`; // CloudTribe image
        }
        console.log('Generated image src:', imageSrc);
        return imageSrc;
    };

    const getFallbackImage = (item: any) => {
        // Return appropriate fallback image based on category
        if (item.category?.includes('茶') || item.category?.includes('飲料')) {
            return '/fruit1.jpg'; // Use fruit image as fallback for drinks
        } else if (item.category?.includes('水果') || item.category?.includes('fruit')) {
            return '/fruit1.jpg';
        } else if (item.category?.includes('蔬菜') || item.category?.includes('vegetable')) {
            return '/vegetable1.jpg';
        } else if (item.category?.includes('雞') || item.category?.includes('鴨') || item.category?.includes('肉')) {
            return '/eat.jpg'; // Use food image for meat products
        } else {
            return '/box2.png'; // Default fallback
        }
    };



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
                {order.order_status === '接單' && showCompleteButton && (
                <div>
                <Button
                    className="bg-white text-black border border-black hover:text-black hover:bg-white transition-all duration-300"
                    onClick={() => {
                        const confirmedFirst = window.confirm("請確認該訂單貨物已到達目的地，確定要完成訂單？");
                        if (!confirmedFirst) return;
                        const confirmedSecond = window.confirm("確認後將無法更改，確定要完成訂單？");
                        if (confirmedSecond) {
                            onComplete(order.id?.toString() || "", order.service);
                        }
                    }}
                >
                    各別訂單物品已到達目的地
                </Button>
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
                {/* Display previous driver info if the order was transferred */}
                {/* {order.previous_driver_name && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-700 font-bold">🔄轉單自: {order.previous_driver_name} ({order.previous_driver_phone})</p>
                    </div>
                )} */}
                {/* Transfer form for entering new driver's phone number */}
                {showTransferForm && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-700 font-bold">(沒有棄單，只有找到新司機才可以轉單)
                            請輸入新司機的電話號碼:</p>
                        <Input
                            type="text"
                            value={newDriverPhone}
                            onChange={(e) => setNewDriverPhone(e.target.value)}
                            placeholder="7到10位數字"
                        />
                        <Button className="mt-2 bg-red-500 text-white" onClick={handleTransfer}>確認轉單</Button>
                        {transferError && (
                            <p className="text-red-600 mt-2">{transferError}</p>
                        )}
                    </div>
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
                                    <li key={index} className="flex justify-between">
                                        <span>• {item.item_name}</span>
                                        <span>數量: {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                            <strong>取貨地點:</strong> {order.location}
                        </div>

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
                {/* Action buttons for accepting, transferring, or navigating to the order */}
                {order.order_status !== '已完成' && (
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {order.order_status === '未接單' ? (
                                <Button className="bg-black text-white" onClick={handleAccept}>接單</Button>
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
                                    <Button 
                                        className="bg-red-500 text-white hover:bg-red-600" 
                                        onClick={() => setShowTransferForm(true)}
                                    >
                                        🔄 轉單
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
                                                onComplete(order.id.toString(), order.service);
                                            }
                                        }}
                                    >
                                        ✅ 確認送達
                                    </Button>
                                </>
                            ) : (
                                // Default actions for other statuses
                                <>
                                    <Button className="bg-red-500 text-white" onClick={() => setShowTransferForm(true)}>轉單</Button>
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
