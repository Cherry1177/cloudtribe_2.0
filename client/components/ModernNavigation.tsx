'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import UserService from '@/services/user/user';
import { User } from '@/interfaces/user/user';

interface ModernNavigationProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
}

export const ModernNavigation: React.FC<ModernNavigationProps> = ({ 
  title, 
  showBackButton = false, 
  backHref = '/' 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const _user = UserService.getLocalStorageUser();
    setUser(_user);
  }, []);

  const handleLogout = () => {
    UserService.emptyLocalStorageUser();
    router.push('/login');
  };

  if (!isClient) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={() => router.push(backHref)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="relative">
            <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
            <Image src={`/newlogo.png`} alt="CloudTribe" width={56} height={56} className="relative z-10 rounded-lg" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              CloudTribe
            </h1>
            <p className="text-xs text-purple-100 font-medium">{title}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && user.id !== 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-white">歡迎回來</p>
              <p className="text-lg font-bold text-yellow-300">{user.name}</p>
            </div>
          )}
          <Button 
            onClick={handleLogout}
            size="sm" 
            className="bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white hover:bg-white hover:text-purple-600 font-semibold px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
          >
            登出
          </Button>
        </div>
      </div>
    </div>
  );
};
