'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UserService from '@/services/user/user';
import { User } from '@/interfaces/user/user';

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const _user = UserService.getLocalStorageUser();
    setUser(_user);
  }, []);

  // If user is logged in, show role selection
  if (isClient && user && user.id !== 0) {
  return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-6 px-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                <Image src={`/newlogo.png?v=${Date.now()}`} alt="CloudTribe" width={64} height={64} className="relative z-10 rounded-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    CloudTribe
                </h1>
                <p className="text-xs text-purple-100 font-medium">順路經濟平台</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">歡迎回來</p>
                <p className="text-lg font-bold text-yellow-300">{user.name}</p>
              </div>
              <Link href="/login" onClick={() => UserService.emptyLocalStorageUser()}>
                <Button 
                  size="sm" 
                  className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white hover:bg-white hover:text-purple-600 font-semibold px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  登出
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="max-w-md mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">選擇您的角色</h2>
            <p className="text-gray-600">請選擇您想要使用的功能</p>
          </div>

          <div className="space-y-4">
            {/* Buyer Button */}
            <Link href="/buyer_options">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">買家</h3>
                      <p className="text-gray-600 text-sm">購買商品、團購、尋找服務</p>
                </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
            </Link>

            {/* Seller Button */}
            <Link href="/seller_options">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">賣家</h3>
                      <p className="text-gray-600 text-sm">販售商品、管理訂單、建立商店</p>
          </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
            </Link>

            {/* Driver Button */}
            <Link href="/driver">
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">司機</h3>
                      <p className="text-gray-600 text-sm">接單配送、共乘服務、賺取收入</p>
              </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
          </div>
        </div>
      </main>
    );
  }

  // If user is not logged in, show login page
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-6 px-6 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                      <Image src={`/newlogo.png?v=${Date.now()}`} alt="CloudTribe" width={64} height={64} className="relative z-10 rounded-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                CloudTribe
              </h1>
              <p className="text-xs text-purple-100 font-medium">順路經濟平台</p>
            </div>
          </div>
            </div>
          </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-16">
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              <span className="block">歡迎來到</span>
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                CloudTribe
              </span>
              <span className="block text-2xl md:text-3xl mt-2">順路經濟平台</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl mx-auto">
              連接真實世界的順路經濟平台，讓您輕鬆建立、組織並壯大社群。
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                立即開始
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                        <Image src={`/newlogo.png?v=${Date.now()}`} alt="CloudTribe" width={40} height={40} className="relative z-10 mr-2 rounded-lg" />
            </div>
            <h3 className="text-lg font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">CloudTribe</h3>
          </div>
          <p className="text-purple-100 text-sm mb-4 font-medium">
            連接真實世界的順路經濟平台
          </p>
          <p className="text-purple-200 text-xs">
            © 2025 CloudTribe. 保留所有權利。
          </p>
      </div>
    </footer>
    </main>
  );
}
