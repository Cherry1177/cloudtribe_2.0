'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faBars, faSignOutAlt, faUser, faShoppingCart, faStore, faTruck } from '@fortawesome/free-solid-svg-icons';
import UserService from '@/services/user/user';
import { User } from '@/interfaces/user/user';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UnifiedNavigationProps {
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({ 
  title = "CloudTribe", 
  showBackButton = false, 
  backHref = '/' 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const navigationItems = [
    { 
      title: '買家', 
      href: '/buyer_options', 
      icon: faShoppingCart,
      description: '商品瀏覽與購買'
    },
    { 
      title: '賣家', 
      href: '/seller_options', 
      icon: faStore,
      description: '商品管理與銷售'
    },
    { 
      title: '司機專區', 
      href: '/driver', 
      icon: faTruck,
      description: '訂單配送服務'
    },
  ];

  if (!isClient) return null;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backHref)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 hover:scale-105"
                aria-label="返回上一頁"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-xl group-hover:bg-opacity-30 transition-all duration-200"></div>
                <Image 
                  src={`/newlogo.png?v=${Date.now()}`} 
                  alt="CloudTribe" 
                  width={48} 
                  height={48} 
                  className="relative z-10 rounded-xl group-hover:scale-105 transition-transform duration-200" 
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-wide bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  CloudTribe
                </h1>
                {title !== "CloudTribe" && (
                  <p className="text-xs text-purple-100 font-medium">{title}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Center - Navigation Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 hover:scale-105 group"
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold">{item.title}</span>
              </Link>
            ))}
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-white hover:bg-white hover:bg-opacity-20 hover:text-white p-2 rounded-lg transition-all duration-200"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{user.name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/setting" className="flex items-center space-x-2 w-full">
                      <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                      <span>設定</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                    <span>登出</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                asChild 
                variant="outline" 
                className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-200 hover:scale-105"
              >
                <Link href="/login">登入</Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2"
                  >
                    <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {navigationItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link 
                        href={item.href} 
                        className="flex items-center space-x-3 w-full p-3"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <FontAwesomeIcon icon={item.icon} className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {user && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link 
                          href="/setting" 
                          className="flex items-center space-x-2 w-full"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                          <span>設定</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                        <span>登出</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UnifiedNavigation;
