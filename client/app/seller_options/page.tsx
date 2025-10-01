'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { UnifiedNavigation } from '@/components/UnifiedNavigation';
import HistoryManagement from '@/components/history/HistoryManagement';
import UserService from '@/services/user/user';

export default function SellerOptionsPage() {
  const [showHistoryManagement, setShowHistoryManagement] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = UserService.getLocalStorageUser();
    setUser(userData);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      <UnifiedNavigation title="賣家專區" showBackButton={true} />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 relative overflow-hidden">
        {/* Beautiful Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          {/* Floating business elements */}
          <div className="absolute top-16 left-16 w-24 h-24 bg-white rounded-lg shadow-2xl animate-pulse transform rotate-45"></div>
          <div className="absolute top-32 right-24 w-20 h-20 bg-white rounded-lg shadow-xl animate-bounce transform rotate-12" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 left-1/4 w-16 h-16 bg-white rounded-lg shadow-lg animate-pulse transform -rotate-12" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-16 right-1/3 w-12 h-12 bg-white rounded-lg shadow-md animate-bounce transform rotate-45" style={{animationDelay: '0.5s'}}></div>
          
          {/* Business/store icons */}
          <div className="absolute top-20 right-16 w-8 h-8 text-white opacity-30">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2ZM12 4.5L19.5 8.5V10C19.5 15.2 16.4 18.8 12 20.1C7.6 18.8 4.5 15.2 4.5 10V8.5L12 4.5Z"/>
            </svg>
          </div>
          <div className="absolute bottom-20 left-16 w-6 h-6 text-white opacity-30">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2ZM12 4.5L19.5 8.5V10C19.5 15.2 16.4 18.8 12 20.1C7.6 18.8 4.5 15.2 4.5 10V8.5L12 4.5Z"/>
            </svg>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Enhanced icon with glow effect */}
          <div className="w-32 h-32 mx-auto mb-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white border-opacity-30">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl">
            歡迎成為
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              賣家
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            開始在 CloudTribe 平台上銷售您的商品，建立您的商業帝國
          </p>
        </div>
      </section>

      {/* Main Option Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              賣家管理中心
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              管理您的商品和訂單，提供優質的客戶服務
            </p>
          </div>

          {/* Two Main Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Management Card */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden transform hover:-translate-y-2 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2 rounded-full font-bold z-20 shadow-lg">
                  📦 商品
                </div>
                <CardHeader className="pb-6 pt-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl font-black text-gray-900 mb-2">
                    商品管理
                  </CardTitle>
                  <p className="text-lg text-gray-600 mb-6">
                    上傳、編輯和管理您的商品資訊
                  </p>
                </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">新增商品資訊</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">編輯商品詳情</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">庫存管理</p>
                  </div>
                </div>

                <Link href="/tribe_resident/seller" className="block">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-lg">
                    📦 管理商品
                  </Button>
                </Link>
              </CardContent>
              </div>
            </Card>

            {/* Order Management Card */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden transform hover:-translate-y-2 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="absolute top-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm px-4 py-2 rounded-full font-bold z-20 shadow-lg">
                  📋 訂單
                </div>
                <CardHeader className="pb-6 pt-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl font-black text-gray-900 mb-2">
                    訂單管理
                  </CardTitle>
                  <p className="text-lg text-gray-600 mb-6">
                    查看新訂單、處理訂單狀態、準備配送
                  </p>
                </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">查看新訂單</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">訂單準備中</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">準備配送</p>
                  </div>
                </div>

                <Link href="/tribe_resident/seller/orders" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-lg">
                    📋 管理訂單
                  </Button>
                </Link>
              </CardContent>
              </div>
            </Card>
          </div>

          {/* Transaction History Management Section */}
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">交易記錄管理</h3>
              <p className="text-gray-600 mb-8">匯出交易記錄與清理舊資料</p>
              
              <Button 
                onClick={() => setShowHistoryManagement(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-lg"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                📊 交易記錄管理
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                        <Image src={`/newlogo.png`} alt="CloudTribe" width={40} height={40} className="relative z-10 mr-2 rounded-lg" />
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">CloudTribe</h3>
          </div>
          <p className="text-blue-100 text-sm mb-4 font-medium">
            連接真實世界的順路經濟平台
          </p>
          <p className="text-blue-200 text-xs">
            © 2025 CloudTribe. 保留所有權利。
          </p>
        </div>
      </footer>

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
                userType="seller" 
                userName={user.name}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}