'use client';

import React from 'react';
import Image from 'next/image';
import { UserForm } from '@/components/login/UserForm';

const LoginPage: React.FC = () => {
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

      {/* Login Section */}
      <section className="py-16">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">歡迎回來</h2>
            <p className="text-gray-600">登入您的帳戶以繼續使用 CloudTribe</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <UserForm />
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

export default LoginPage;
