'use client'
import React, { useState, useEffect } from "react";
import Link from 'next/link'
import { User } from '@/interfaces/user/user';
import { ProductInfo } from '@/interfaces/tribe_resident/seller/seller';
import UserService from '@/services/user/user'
import ConsumerService from '@/services/consumer/consumer'
import { AddCartRequest } from "@/interfaces/consumer/consumer";
import { CATEGORIES } from "@/constants/constants";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UnifiedNavigation } from "@/components/UnifiedNavigation";
import PaginationDemo from "@/components/tribe_resident/buyer/PaginationDemo";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Page() {
  const ITEM_PER_PAGE = 16
  const [user, setUser] = useState<User | null>(null); 
  const [onShelfProducts, setOnShelfProducts] = useState<ProductInfo[]>()
  const [mapItems, setMapItems] = useState<ProductInfo[]>()
  const [searchContent, setSearchContent] = useState('')
  const [currentPage, setCurrentPage] = useState(1);
  const [cartMessage, setCartMessage] = useState('empty')
  
  useEffect(() => {
    const _user = UserService.getLocalStorageUser();
    if (!_user || _user.id === 0 || _user.name === 'empty' || _user.phone === 'empty') {
      setUser(null);  // set to not login
    } else {
      setUser(_user);  // set to login
    }
    get_on_sell_product();
  }, []);
  

  const get_on_sell_product = async() => {
    try{
      const products = await ConsumerService.get_on_sell_product()
      setMapItems(products)
      setOnShelfProducts(products)
    }
    catch(e){
      console.log('Show agricultural produce error occur')
    }
    
    
  }
  const handleSelect = (value: string) => {
    const products = onShelfProducts?.filter((product) => product.category == value)
    if(products != undefined){
      setMapItems(products)
    }
  }
  const handleSearchRegion: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchContent(event.target.value);
  }
  const handleSearchButton = () => {
    const products = onShelfProducts?.filter((product) => 
      product.name.toLowerCase().includes(searchContent.toLowerCase())
    )
    if(products != undefined){
      setMapItems(products)
    }
  }
  const handleAddCart = async (produceId: Number, unit: string) => {
    // check if user is login
    if (!user || user.id === 0 || user.name === 'empty' || user.phone === 'empty') {
      alert('請先按右上角的登入');
      return;
    }
  
    // check if input is valid
    const inputElement = document.getElementById(`quantity-${produceId}`) as HTMLInputElement | null;
    if (inputElement && user) {
      const req: AddCartRequest = {
        buyer_id: user.id,
        produce_id: produceId,
        quantity: parseInt(inputElement.value, 10),
      };
  
      try {
        const res = await ConsumerService.add_shopping_cart(req);
        if (res === "shopping cart has already had this item") {
          setCartMessage("此商品已在購物車中");
        } else {
          setCartMessage("成功加入購物車!");
        }
        setTimeout(() => setCartMessage('empty'), 2000);
      } catch (e) {
        setCartMessage("加入購物車失敗");
        setTimeout(() => setCartMessage('empty'), 2000);
      }
    }
  };
  const startIdx = (currentPage - 1) * ITEM_PER_PAGE;
  const endIdx = startIdx + ITEM_PER_PAGE;
  const currentData = mapItems?.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <UnifiedNavigation title="商品瀏覽" /> 
      
      {/* Hero Section */}
      <header className="relative w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-6xl font-bold mb-4">
              🌱 部落農產品
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              新鮮直送的有機農產品，支持在地農民，享受健康生活
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input 
                    type="text" 
                    placeholder="請輸入農產品名稱" 
                    className="h-12 text-lg border-2 border-gray-200 focus:border-green-500 rounded-xl"
                    onChange={handleSearchRegion}
                  />
                </div>
                <Button 
                  onClick={handleSearchButton}
                  className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  搜尋
                </Button>
              </div>
              
              <Select onValueChange={handleSelect}>
                <SelectTrigger className="h-12 text-lg border-2 border-gray-200 focus:border-green-500 rounded-xl text-gray-900">
                  <SelectValue placeholder="請選擇要查詢的類別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CATEGORIES.map((category) => 
                      <SelectItem key={category.value} value={category.value}>
                        {category.name}
                      </SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/consumer/purchased_item">
              <Button 
                variant="outline" 
                className="h-12 px-6 bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-green-700 font-semibold rounded-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                我的商品
              </Button>
            </Link>
            <Link href="/consumer/shopping_cart">
              <Button 
                variant="outline" 
                className="h-12 px-6 bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-green-700 font-semibold rounded-xl transition-all duration-300">
                <FontAwesomeIcon icon={faShoppingCart} className="mr-2"/>
                購物車
              </Button>
            </Link>
          </div>
        </div>

        {/* Cart Message Alert */}
        {cartMessage != 'empty' && 
        <div className="absolute top-4 right-4 z-30">
          <Alert className="bg-green-100 border-green-300 text-green-800 shadow-lg">
            <AlertDescription className="text-lg font-semibold">
              {cartMessage}
            </AlertDescription>
          </Alert>
        </div>}
      </header>
      
      {/* Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-8">
          {mapItems?.length == 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">查無此類商品</h3>
              <p className="text-gray-600">請嘗試其他搜尋條件或商品類別</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentData != undefined && currentData.map((product) => (  
                <div key={product.id.toString()} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  {/* Product Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src={product.img_link} 
                      alt={product.name} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      有機天然
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-green-600 mb-4">${String(product.price)} / {product.unit}</p>
                    
                    {/* Quantity Input */}
                    <div className="flex items-center space-x-3 mb-4">
                      <label htmlFor={`quantity-${product.id}`} className="text-sm font-semibold text-gray-700">購買數量:</label>
                      <Input
                        type="number"
                        id={`quantity-${product.id}`}
                        className="w-20 text-center border-2 border-gray-200 focus:border-green-500 rounded-lg"
                        defaultValue={1}
                        min={1}
                      />
                    </div>
                    
                    {/* Add to Cart Button */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => handleAddCart(product.id, product.unit)}>
                      <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                      加入購物車
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-8">
          <PaginationDemo
            totalItems={mapItems?.length != undefined ? mapItems?.length : 0}
            itemsPerPage={ITEM_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>
    </div>
  )
}