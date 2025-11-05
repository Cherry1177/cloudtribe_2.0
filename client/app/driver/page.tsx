"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import DriverForm from "@/components/driver/DriverForm";
import OrderListWithPagination from "@/components/driver/OrderListWithPagination";
import DriverOrdersPage from "@/components/driver/DriverOrdersPage";
import DriverAvailableTimes from "@/components/driver/DriverAvailableTimes"; 
import HistoryManagement from "@/components/history/HistoryManagement";
import { UnifiedNavigation } from "@/components/UnifiedNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useRouter } from 'next/navigation';
import UserService from '@/services/user/user'; 
import DriverService  from '@/services/driver/driver';
import { Driver } from '@/interfaces/driver/driver'; 
import { Order } from '@/interfaces/tribe_resident/buyer/order';
import { DriverOrder } from '@/interfaces/driver/driver';


const DriverPage: React.FC = () => {
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showDriverOrders, setShowDriverOrders] = useState(false);
    const [unacceptedOrders, setUnacceptedOrders] = useState<Order[]>([]);
    const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
    const [driverData, setDriverData] = useState<Driver | null>(null);
    const router = useRouter();
    const [user, setUser] = useState(UserService.getLocalStorageUser());
    const [isClient, setIsClient] = useState(false); 
    const [showAddTimeTip, setShowAddTimeTip] = useState(true);

    // add state for showing unaccepted orders - default to true so drivers see orders immediately
    const [showUnacceptedOrders, setShowUnacceptedOrders] = useState(true);
    const [showHistoryManagement, setShowHistoryManagement] = useState(false);
    const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
    const [showPendingTransfers, setShowPendingTransfers] = useState(false);
    const [overdueOrders, setOverdueOrders] = useState<any[]>([]);
    const [overdueCount, setOverdueCount] = useState<number>(0);



    useEffect(() => {
        setShowAddTimeTip(true);
        setIsClient(true);
        const handleUserDataChanged = () => {
            const updatedUser = UserService.getLocalStorageUser();
            setUser(updatedUser);
        };
    
        window.addEventListener("userDataChanged", handleUserDataChanged);
    
        return () => {
            window.removeEventListener("userDataChanged", handleUserDataChanged);
        };
    }, []);

    // ensure user.is_driver is a boolean
    useEffect(() => {
        if (user && typeof user.is_driver === 'string') {
            user.is_driver = user.is_driver === 'true';
            setUser({ ...user });
        }
    }, [user]);

    // use user.id to get driverData
    useEffect(() => {
        /**
         * Fetch driver data based on user_id.
         * @param userId - The user's ID.
         */
        const fetchDriverData = async (userId: number) => {
            try {
                console.log(`Fetching driver data for user ID: ${userId}`);
                const response = await fetch(`/api/drivers/user/${userId}`);
                console.log(`Driver API response status: ${response.status}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        console.warn("使用者尚未成為司機 - 需要重新申請");
                        // Reset user.is_driver to false since there's no driver record
                        const updatedUser = { ...user, is_driver: false };
                        UserService.setLocalStorageUser(updatedUser);
                        setUser(updatedUser);
                    } else {
                        const errorText = await response.text();
                        console.error(`Failed to fetch driver data: ${response.status} - ${errorText}`);
                    }
                } else {
                    const data: Driver = await response.json();
                    console.log('Driver data loaded:', data);
                    setDriverData(data);
                    handleFetchDriverOrders(data.id);
                    // Fetch overdue orders when driver data is loaded
                    handleFetchOverdueOrders(data.id);
                    // Automatically fetch unaccepted orders when driver data is loaded
                    if (showUnacceptedOrders) {
                        handleFetchUnacceptedOrders();
                    }
                }
            } catch (error) {
                console.error('Error fetching driver data:', error);
            }
        };

        if (isClient && user && user.is_driver) {
            fetchDriverData(user.id);
        }
    }, [isClient, user]);



    /**
     * Fetch unaccepted orders and filter out expired ones.
     */
    const handleFetchUnacceptedOrders = async () => {
        try {
            console.log('Fetching unaccepted orders...');
            const response = await fetch(`/api/orders/`);
            if (!response.ok) {
                throw new Error('Failed to fetch unaccepted orders');
            }
            
            let data: Order[] = await response.json();
            console.log('Raw orders data:', data);
            
            // Filter for unaccepted orders and remove expired ones
            const now = new Date();
            const ORDER_EXPIRY_HOURS = 2; // Orders expire after 2 hours
            
            data = data.filter((order) => {
                // Only show unaccepted orders
                if (order.order_status !== "未接單") return false;
                
                // Check if order is expired
                if (order.timestamp) {
                    const orderTime = new Date(order.timestamp);
                    const hoursOld = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);
                    
                    if (hoursOld > ORDER_EXPIRY_HOURS) {
                        console.log(`Order ${order.id} is ${hoursOld.toFixed(1)} hours old - filtering out`);
                        return false;
                    }
                }
                
                return true;
            }).sort((a, b) => {
                // Sort by urgency first, then by timestamp (newest first)
                if (b.is_urgent !== a.is_urgent) {
                    return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0);
                }
                // If both urgent or both not urgent, sort by timestamp
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
            });
                
            console.log('Filtered unaccepted orders (excluding expired):', data);
            setUnacceptedOrders(data);
        } catch (error) {
            console.error('Error fetching unaccepted orders:', error);
        }
    };

    /**
     * Fetch accepted orders assigned to the driver.
     * @param driverId - The driver's ID.
     */
    const handleFetchDriverOrders = async (driverId: number) => {
        try {
            const response = await fetch(`/api/drivers/${driverId}/orders`);
            if (!response.ok) {
                throw new Error('Failed to fetch driver orders');
            }
            const data = await response.json();
            setAcceptedOrders(data);
        } catch (error) {
            console.error('Error fetching driver orders:', error);
        }
    };

    /**
     * Fetch overdue orders for the driver (orders accepted more than 2 hours ago and not completed).
     * @param driverId - The driver's ID.
     */
    const handleFetchOverdueOrders = async (driverId: number) => {
        try {
            const response = await fetch(`/api/drivers/${driverId}/overdue-orders`);
            if (!response.ok) {
                throw new Error('Failed to fetch overdue orders');
            }
            const data = await response.json();
            setOverdueOrders(data.overdue_orders || []);
            setOverdueCount(data.overdue_count || 0);
        } catch (error) {
            console.error('Error fetching overdue orders:', error);
            setOverdueOrders([]);
            setOverdueCount(0);
        }
    };



    //New Version to handle accepting an order
    
    const handleAcceptOrder = async (orderId: string, service: string) => {
        // Check if driver has overdue orders
        if (overdueCount > 0) {
            alert(`您有 ${overdueCount} 筆訂單超過 2 小時未完成配送，請先完成已接受的訂單後再接受新訂單`);
            return;
        }

        // First confirmation
        const confirmFirst = window.confirm("您確定要接單嗎？");
        if (!confirmFirst) return;

        // Second confirmation
        const confirmSecond = window.confirm("請再次確認：確定接單？");
        if (!confirmSecond) return;
        
        if (!driverData || !driverData.id) {
            console.error("Driver data is missing or incomplete");
            return;
        }
        try {
            const timestamp = new Date().toISOString();
            const acceptOrder: DriverOrder = {
                driver_id: driverData.id,
                order_id: parseInt(orderId),  
                action: "接單",
                timestamp: timestamp,
                previous_driver_id: undefined,
                previous_driver_name: undefined,
                previous_driver_phone: undefined,
                service: service
            }
            await DriverService.handle_accept_order(service, parseInt(orderId), acceptOrder)
            alert('接單成功');

            // Refresh overdue orders and unaccepted orders
            await handleFetchOverdueOrders(driverData.id);
            handleFetchUnacceptedOrders();
            // Navigate to 管理訂單和導航 page with order information for consistent navigation
            // The navigation page will handle displaying driver orders when driverId is provided
            if (driverData?.id) {
                router.push(`/navigation?driverId=${driverData.id}`);
            } else {
                router.push('/navigation');
            }
        } catch (error: any) {
            // Handle errors gracefully without showing console errors
            const errorMessage = error?.message?.includes('無法接取自己的訂單') 
                ? '無法接取自己的訂單'
                : error?.message?.includes('已被接')
                ? '訂單已被其他司機接走'
                : error?.message?.includes('訂單未找到')
                ? '訂單不存在'
                : error?.message?.includes('超過 2 小時未完成配送')
                ? error.message
                : '接單失敗，請稍後再試';
            
            alert(errorMessage);
        }
    };


    /**
     * Handle navigating to order details.
     * @param orderId - The ID of the order to navigate to.
     * @param driverId - The driver's ID.
     */
    const handleNavigate = async (orderId: string, driverId: number) => {
        try {
            // Fetch order data to get destination location for consistent navigation
            const orderResponse = await fetch(`/api/orders/${orderId}`);
            if (orderResponse.ok) {
                const orderData = await orderResponse.json();
                if (orderData.location) {
                    // Use same format as other navigation calls: orderId, driverId, and destination
                    const navUrl = `/navigation?orderId=${orderId}&driverId=${driverId}&destination=${encodeURIComponent(orderData.location)}`;
                    router.push(navUrl);
                } else {
                    // Fallback if location is not available
                    router.push(`/navigation?orderId=${orderId}&driverId=${driverId}`);
                }
            } else {
                // Fallback if order fetch fails
                router.push(`/navigation?orderId=${orderId}&driverId=${driverId}`);
            }
        } catch (error) {
            console.error('Error fetching order for navigation:', error);
            // Fallback if there's an error
            router.push(`/navigation?orderId=${orderId}&driverId=${driverId}`);
        }
    };

    /**
     * Handle completing an order.
     * @param orderId - The ID of the order to complete.
     */
    const handleCompleteOrder = async (orderId: string, service: string) => {
        if (!driverData?.id) return;
        
        try {
            const response = await fetch(`/api/orders/${service}/${orderId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to complete order');
            }

            alert('訂單已完成');
            
            // Refresh overdue orders and driver orders after completion
            await handleFetchOverdueOrders(driverData.id);
            await handleFetchDriverOrders(driverData.id);

        } catch (error) {
            console.error('Error completing order:', error);
            alert('完成訂單失敗');
        }
    };

    /**
     * Handle pickup confirmation.
     * @param orderId - The ID of the order to confirm pickup.
     * @param service - The service type of the order.
     */
    const handlePickupOrder = async (orderId: string, service: string) => {
        try {
            const response = await fetch(`/api/orders/${service}/${orderId}/pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to confirm pickup');
            }

            alert('已確認取貨！開始配送');
            
            // Refresh driver orders
            if (driverData?.id) {
                handleFetchDriverOrders(driverData.id);
            }
            
            // Fetch order details to get location, then navigate to GPS navigation page
            try {
                const orderResponse = await fetch(`/api/orders/${orderId}`);
                if (orderResponse.ok) {
                    const orderData = await orderResponse.json();
                    if (orderData.location && driverData?.id) {
                        // Wait a moment for the status update to complete, then navigate
                        setTimeout(() => {
                            const navUrl = `/navigation?orderId=${orderId}&driverId=${driverData.id}&destination=${encodeURIComponent(orderData.location)}`;
                            window.open(navUrl, '_blank');
                        }, 500);
                    }
                }
            } catch (orderError) {
                console.error('Error fetching order details for navigation:', orderError);
                // If fetching order fails, still proceed - navigation is optional
            }

        } catch (error) {
            console.error('Error confirming pickup:', error);
            alert('確認取貨失敗');
        }
    };

    /**
     * Handle applying to become a driver.
     */
    const handleApplyDriverClick = () => {
        if (!user || user.id === 0 || user.name === 'empty' || user.phone === 'empty') {
            alert('請先按右上角的登入');
        } else {
            setShowRegisterForm(true);
        }
    };

    /**
     * Handle successful driver data update.
     * @param data - Updated driver data.
     */
    const handleUpdateSuccess = (data: Driver): void => {
        setDriverData(data);

        // Update user to driver
        const updatedUser = { ...user, is_driver: true };
        UserService.setLocalStorageUser(updatedUser);
        setUser(updatedUser);
        setShowRegisterForm(false);
    };


    /**
     * Toggle the visibility of Unaccepted Orders List
     */
    const toggleUnacceptedOrders = () => {
        setShowUnacceptedOrders(prev => {
            const newState = !prev;
            if (newState && unacceptedOrders.length === 0) {
                handleFetchUnacceptedOrders();
            }
            return newState;
        });
    };

    // Auto-fetch unaccepted orders when driver data is loaded and list should be shown
    useEffect(() => {
        if (isClient && user?.is_driver && driverData && showUnacceptedOrders && unacceptedOrders.length === 0) {
            handleFetchUnacceptedOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient, user?.is_driver, driverData?.id, showUnacceptedOrders]);

    /**
     * Fetch pending transfer requests for the driver
     */
    const handleFetchPendingTransfers = async () => {
        if (!driverData?.id) return;
        
        try {
            const response = await fetch(`/api/orders/pending-transfers/${driverData.id}`);
            if (response.ok) {
                const data = await response.json();
                setPendingTransfers(data);
            }
        } catch (error) {
            console.error('Error fetching pending transfers:', error);
        }
    };

    // Auto-fetch pending transfers and overdue orders when driver data is loaded
    useEffect(() => {
        if (driverData?.id) {
            handleFetchPendingTransfers();
            handleFetchOverdueOrders(driverData.id);
            // Poll for new pending transfers every 30 seconds
            const pendingTransfersInterval = setInterval(handleFetchPendingTransfers, 30000);
            // Poll for overdue orders every 60 seconds
            const overdueOrdersInterval = setInterval(() => handleFetchOverdueOrders(driverData.id), 60000);
            return () => {
                clearInterval(pendingTransfersInterval);
                clearInterval(overdueOrdersInterval);
            };
        }
    }, [driverData?.id]);

    /**
     * Handle accepting a pending transfer
     */
    const handleAcceptPendingTransfer = async (transferId: number) => {
        if (!driverData?.id) return;
        
        const confirmed = window.confirm('確定要接受此轉單請求嗎？');
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/orders/pending-transfers/${transferId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driver_id: driverData.id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || '接受轉單失敗');
            }

            const result = await response.json();
            alert(result.message || '轉單已成功接受');
            
            // Refresh data
            await handleFetchPendingTransfers();
            if (driverData.id) {
                handleFetchDriverOrders(driverData.id);
            }
        } catch (error: any) {
            console.error('Error accepting pending transfer:', error);
            alert(error?.message || '接受轉單失敗');
        }
    };

    /**
     * Handle rejecting a pending transfer
     */
    const handleRejectPendingTransfer = async (transferId: number) => {
        if (!driverData?.id) return;
        
        const confirmed = window.confirm('確定要拒絕此轉單請求嗎？');
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/orders/pending-transfers/${transferId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driver_id: driverData.id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || '拒絕轉單失敗');
            }

            const result = await response.json();
            alert(result.message || '轉單請求已拒絕');
            
            // Refresh pending transfers
            await handleFetchPendingTransfers();
        } catch (error: any) {
            console.error('Error rejecting pending transfer:', error);
            alert(error?.message || '拒絕轉單失敗');
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
            <UnifiedNavigation title="司機專區" showBackButton={true} />
            
            {/* Hero Section */}
            <section className="py-20 bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 relative overflow-hidden">
                {/* Beautiful Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    {/* Floating delivery elements */}
                    <div className="absolute top-16 left-16 w-24 h-24 bg-white shadow-2xl animate-pulse transform rotate-45"></div>
                    <div className="absolute top-32 right-24 w-20 h-20 bg-white rounded-full shadow-xl animate-bounce" style={{animationDelay: '1s'}}></div>
                    <div className="absolute bottom-24 left-1/4 w-16 h-16 bg-white shadow-lg animate-pulse transform -rotate-45" style={{animationDelay: '2s'}}></div>
                    <div className="absolute bottom-16 right-1/3 w-12 h-12 bg-white rounded-full shadow-md animate-bounce" style={{animationDelay: '0.5s'}}></div>
                    
                    {/* Delivery/truck icons */}
                    <div className="absolute top-20 right-16 w-8 h-8 text-white opacity-30">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17S5.17 15.5 6 15.5 7.5 16.17 7.5 17 6.83 18.5 6 18.5ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17S17.17 15.5 18 15.5 19.5 16.17 19.5 17 18.83 18.5 18 18.5ZM17 12V9.5H19.5L21.46 12H17Z"/>
                        </svg>
                    </div>
                    <div className="absolute bottom-20 left-16 w-6 h-6 text-white opacity-30">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17S5.17 15.5 6 15.5 7.5 16.17 7.5 17 6.83 18.5 6 18.5ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17S17.17 15.5 18 15.5 19.5 16.17 19.5 17 18.83 18.5 18 18.5ZM17 12V9.5H19.5L21.46 12H17Z"/>
                        </svg>
                    </div>
                </div>
                
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    {/* Enhanced icon with glow effect */}
                    <div className="w-32 h-32 mx-auto mb-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white border-opacity-30">
                        <div className="w-20 h-20 bg-gradient-to-br from-white to-orange-100 rounded-full flex items-center justify-center shadow-inner">
                            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl">
                        司機
                        <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                            專區
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                        管理您的配送時間、訂單和導航服務
                    </p>
                </div>
            </section>

            {/* Reminder Alert */}
            {showAddTimeTip && (
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl relative" role="alert">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">提醒</h3>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <p>1. 如果有接單，請記得到新增時間去填寫可運送時間</p>
                                    <p>2. 接單時請自行評估要運送多少商品 (以車子是否放得下為主要考量)</p>
                                </div>
                            </div>
                            <button
                                className="ml-4 flex-shrink-0 text-blue-400 hover:text-blue-600"
                                onClick={() => setShowAddTimeTip(false)}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-col items-center space-y-6">

                        {/* If user is not a driver OR is marked as driver but has no driver data */}
                        {(isClient && (!user?.is_driver || (user?.is_driver && !driverData))) && (
                            <Card className="w-full max-w-md hover:shadow-xl transition-all duration-300 border-2 border-orange-200 hover:border-orange-400 bg-white">
                                <CardContent className="p-8 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-4">申請成為司機</h3>
                                    <p className="text-gray-600 mb-6">開始您的配送服務，賺取額外收入</p>
                                    <Button 
                                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                        onClick={handleApplyDriverClick}
                                    >
                                        申請司機
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* If user is a driver */}
                        {isClient && user?.is_driver && driverData && (
                            <div className="w-full space-y-6">
                                {/* Overdue Orders Warning */}
                                {overdueCount > 0 && (
                                    <Card className="w-full border-2 border-red-500 bg-gradient-to-r from-red-50 to-orange-50">
                                        <CardHeader>
                                            <CardTitle className="text-xl font-bold text-red-700 flex items-center">
                                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                嚴重警告：您有逾期訂單
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-red-700 font-semibold mb-2">
                                                您有 {overdueCount} 筆訂單超過 2 小時未完成配送！
                                            </p>
                                            <p className="text-red-600 mb-3">
                                                在完成這些訂單之前，您無法接受新訂單。請立即完成已接受的訂單。
                                            </p>
                                            <div className="space-y-2">
                                                {overdueOrders.map((order: any) => (
                                                    <div key={`${order.order_id}-${order.service}`} className="bg-white p-3 rounded border border-red-300">
                                                        <p className="text-sm font-medium">
                                                            訂單 #{order.order_id} ({order.service === 'necessities' ? '生活用品' : '農產品'})
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            狀態: {order.order_status} | 接受時間: {order.accepted_at ? new Date(order.accepted_at).toLocaleString('zh-TW') : 'N/A'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {/* Driver Available Times */}
                                <Card className="w-full hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 bg-white">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-2xl font-bold text-center text-gray-900">
                                            管理可用時間
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <DriverAvailableTimes driverId={driverData.id} />
                                    </CardContent>
                                </Card>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 bg-white">
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">管理訂單和導航</h3>
                                            <p className="text-gray-600 mb-4">查看已接訂單並進行導航</p>
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                                onClick={() => {
                                                    setShowDriverOrders(true);
                                                    if (driverData?.id) {
                                                        handleFetchDriverOrders(driverData.id);
                                                    }
                                                }}
                                            >
                                                管理訂單
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 bg-white">
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">未接單表單</h3>
                                            <p className="text-gray-600 mb-4">查看並接受新的配送訂單</p>
                                            <Button 
                                                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                                onClick={toggleUnacceptedOrders}
                                            >
                                                {showUnacceptedOrders ? '隱藏未接單表單' : '取得未接單表單'}
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-green-200 hover:border-green-400 bg-white">
                                        <CardContent className="p-6 text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">交易記錄管理</h3>
                                            <p className="text-gray-600 mb-4">匯出記錄與清理舊資料</p>
                                            <Button 
                                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                                onClick={() => setShowHistoryManagement(true)}
                                            >
                                                管理交易記錄
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Pending Transfers Notification */}
                                {pendingTransfers.length > 0 && (
                                    <Card className="w-full hover:shadow-xl transition-all duration-300 border-2 border-yellow-400 hover:border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                                                    <span className="relative">
                                                        待處理轉單請求
                                                        <span className="absolute -top-2 -right-6 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                            {pendingTransfers.length}
                                                        </span>
                                                    </span>
                                                </CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPendingTransfers(!showPendingTransfers)}
                                                >
                                                    {showPendingTransfers ? '隱藏' : '顯示'}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        {showPendingTransfers && (
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {pendingTransfers.map((transfer) => (
                                                        <div key={transfer.id} className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">訂單編號: {transfer.order_id}</p>
                                                                    <p className="text-sm text-gray-600">轉單來自: {transfer.current_driver_name}</p>
                                                                    <p className="text-sm text-gray-600">聯絡電話: {transfer.current_driver_phone}</p>
                                                                    {transfer.expires_at && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            到期時間: {new Date(transfer.expires_at).toLocaleString('zh-TW')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                                                    onClick={() => handleAcceptPendingTransfer(transfer.id)}
                                                                >
                                                                    接受轉單
                                                                </Button>
                                                                <Button
                                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                                                    onClick={() => handleRejectPendingTransfer(transfer.id)}
                                                                >
                                                                    拒絕轉單
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                )}

                                {/* Unaccepted Orders List */}
                                {showUnacceptedOrders && (
                                    <Card className="w-full hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-400 bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-2xl font-bold text-center text-gray-900">
                                                未接單列表
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <OrderListWithPagination
                                                orders={unacceptedOrders}
                                                onAccept={handleAcceptOrder}
                                                onNavigate={(orderId: string) => handleNavigate(orderId, driverData?.id || 0)}
                                                onComplete={handleCompleteOrder}
                                                driverId={driverData?.id || 0}
                                                hasOverdueOrders={overdueCount > 0}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Modern Footer */}
            <footer className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-8">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                                    <Image src={`/newlogo.png`} alt="CloudTribe" width={40} height={40} className="relative z-10 mr-2 rounded-lg" />
                        </div>
                        <h3 className="text-lg font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">CloudTribe</h3>
                    </div>
                    <p className="text-orange-100 text-sm mb-4 font-medium">
                        連接真實世界的順路經濟平台
                    </p>
                    <p className="text-orange-200 text-xs">
                        © 2025 CloudTribe. 保留所有權利。
                    </p>
                </div>
            </footer>

            {/* Apply for driver */}
            <Sheet open={showRegisterForm} onOpenChange={setShowRegisterForm}>
                <SheetContent 
                    side="right"
                    className="w-full sm:max-w-2xl p-0 sm:p-6"
                >
                    <SheetHeader className="p-6 sm:p-0">
                        <SheetTitle>申請司機</SheetTitle>
                        <SheetClose />
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(100vh-80px)] p-6 sm:p-0">
                        <DriverForm onClose={() => setShowRegisterForm(false)} onUpdateSuccess={handleUpdateSuccess} />
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={showDriverOrders} onOpenChange={setShowDriverOrders}>
                <SheetContent 
                    side="right"
                    className="w-full sm:max-w-2xl p-0 sm:p-6"
                >
                    <SheetHeader className="p-6 sm:p-0">
                        <SheetTitle>我的訂單</SheetTitle>
                        <SheetClose />
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(100vh-80px)] p-6 sm:p-0">
                        {driverData && 
                            <DriverOrdersPage 
                                driverData={driverData} 
                                onAccept={handleAcceptOrder}
                                onNavigate={(orderId: string) => handleNavigate(orderId, driverData?.id || 0)}
                                onComplete={handleCompleteOrder}
                                onPickup={handlePickupOrder}
                            />
                        }
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
                                userType="driver" 
                                userName={user.name}
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </main>
    );

};

export default DriverPage;
