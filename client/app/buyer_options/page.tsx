'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernNavigation } from '@/components/ModernNavigation';

export default function BuyerOptionsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <ModernNavigation title="買家專區" showBackButton={true} />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
        {/* Beautiful Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          {/* Floating shopping elements */}
          <div className="absolute top-16 left-16 w-24 h-24 bg-white rounded-full shadow-2xl animate-pulse"></div>
          <div className="absolute top-32 right-24 w-20 h-20 bg-white rounded-full shadow-xl animate-bounce" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 left-1/4 w-16 h-16 bg-white rounded-full shadow-lg animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-16 right-1/3 w-12 h-12 bg-white rounded-full shadow-md animate-bounce" style={{animationDelay: '0.5s'}}></div>
          
          {/* Shopping bag icons */}
          <div className="absolute top-20 right-16 w-8 h-8 text-white opacity-30">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
            </svg>
          </div>
          <div className="absolute bottom-20 left-16 w-6 h-6 text-white opacity-30">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
            </svg>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Enhanced icon with glow effect */}
          <div className="w-32 h-32 mx-auto mb-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white border-opacity-30">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-green-100 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl">
            歡迎成為
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              買家
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            選擇您的購買方式，享受 CloudTribe 平台上的優質商品
          </p>
        </div>
      </section>

      {/* Options Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              選擇您的購買方式
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              根據您的需求和偏好，選擇最適合的購買方式
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tribe Products Option */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden transform hover:-translate-y-2 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2 rounded-full font-bold z-20 shadow-lg">
                  🌟 推薦
                </div>
                <CardHeader className="pb-6 pt-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl font-black text-center text-gray-900 mb-2">
                    部落農產品
                  </CardTitle>
                  <p className="text-center text-gray-600 text-sm">新鮮直送，支持在地農民</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">新鮮直送的部落農產品</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">支持在地農民和永續農業</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-gray-700">高品質有機商品，健康安全</p>
                    </div>
                  </div>

                          <Link href="/consumer" className="block">
                            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-lg">
                              🛒 開始購買部落農產品
                            </Button>
                          </Link>
                </CardContent>
              </div>
            </Card>

            {/* Local Store Products Option */}
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden transform hover:-translate-y-2 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <CardHeader className="pb-6 pt-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <CardTitle className="text-3xl font-black text-center text-gray-900 mb-2">
                    附近商店商品
                  </CardTitle>
                  <p className="text-center text-gray-600 text-sm">快速配送，立即享受</p>
                </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">從附近商店採購的優質商品</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">快速配送，立即享受</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-700">多樣化商品選擇</p>
                  </div>
                </div>

                        <Link href="/tribe_resident/buyer" className="block">
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 text-lg">
                            🏪 開始購買商店商品
                          </Button>
                        </Link>
              </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                        <Image src={`/newlogo.png?v=${Date.now()}`} alt="CloudTribe" width={40} height={40} className="relative z-10 mr-2 rounded-lg" />
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">CloudTribe</h3>
          </div>
          <p className="text-green-100 text-sm mb-4 font-medium">
            連接真實世界的順路經濟平台
          </p>
          <p className="text-green-200 text-xs">
            © 2025 CloudTribe. 保留所有權利。
          </p>
        </div>
      </footer>
    </main>
  );
}
