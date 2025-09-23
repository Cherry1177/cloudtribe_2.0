'use client'
import React, { useState, useEffect } from "react"
import { SellerDialog } from "@/components/tribe_resident/seller/SellerDialog"
import { ProductTable } from "@/components/tribe_resident/seller/ProductTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NavigationBar } from "@/components/NavigationBar"
import UseService from "@/services/user/user"
import SellerService from "@/services/seller/seller"
import DriverService from "@/services/driver/driver"
import { User } from '@/interfaces/user/user';
import { BasicProductInfo } from '@/interfaces/tribe_resident/seller/seller';
import { DriverTimeDetail } from '@/interfaces/driver/driver';
import { useRouter } from 'next/navigation'
import { DriverDetailedTable } from "@/components/tribe_resident/seller/DriverDetailedTable"

export default function Page(){
  const [user, setUser] = useState<User>()
  const [products, setProducts] = useState<BasicProductInfo[]>([])
  const [driverTimes, setDriverTimes] = useState<DriverTimeDetail[]>([])
  const router = useRouter()
  const today = new Date()
  
  useEffect(() => {
    const _user = UseService.getLocalStorageUser()
    setUser(_user)
    if(_user.name == 'empty'){
      router.replace('/login')
    }   
    get_products(_user)
    get_all_driver_times()
  }, [router])

  const get_products = async(user:User) => {
    if(user != undefined){
      const res_products = await SellerService.get_upload_product(user.id)
      console.log('Get products: ', res_products)
      var _products: BasicProductInfo[] = res_products
      setProducts(_products)
    }    
  }
  const get_all_driver_times = async() => {
    try{
      const res_times = await DriverService.get_all_driver_times()
      var _times: DriverTimeDetail[] = res_times
      setDriverTimes(_times)
    }
    catch(e){
      console.log('Get Driver time error occurs')
    }
    
    
  }
  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <NavigationBar/> 
      
      {/* Header Section */}
      <section className="py-8 bg-gradient-to-r from-[#003049] via-[#1d3557] to-[#457b9d]">
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="text-4xl font-bold text-white mb-2">賣家管理中心</h1>
          <p className="text-xl text-blue-100">管理您的商品和訂單，追蹤銷售表現</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8 -mt-4">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">架上商品</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter((product) => product.off_shelf_date >= today.toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">歷史商品</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter((product) => product.off_shelf_date < today.toISOString().split('T')[0]).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">可用司機</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {driverTimes.filter((time) => {
                      const now = new Date();
                      const [hours, minutes] = time.start_time.split(':');
                      const slotDateTime = new Date(time.date);
                      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      return slotDateTime >= now;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-8">
          <Tabs defaultValue="on shelf" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="on shelf" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-semibold py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                我的架上商品
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-semibold py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                我的歷史商品
              </TabsTrigger>
              <TabsTrigger 
                value="driver" 
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-semibold py-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                司機運送時間
              </TabsTrigger>
            </TabsList>

            <TabsContent value="on shelf" className="mt-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">架上商品</h2>
                  <SellerDialog/>
                </div>
                <ProductTable products={products.filter((product) => product.off_shelf_date >= today.toISOString().split('T')[0])}/>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">歷史商品</h2>
                <ProductTable products={products.filter((product) => product.off_shelf_date < today.toISOString().split('T')[0])}/>
              </div>
            </TabsContent>    

            <TabsContent value="driver" className="mt-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">司機運送時間</h2>
                <div className="space-y-6">
                  {/* Active time slots */}
                  {driverTimes.filter((time) => {
                    const now = new Date();
                    const [hours, minutes] = time.start_time.split(':');
                    const slotDateTime = new Date(time.date);
                    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    return slotDateTime >= now;
                  }).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        可用運送時間
                      </h3>
                      <DriverDetailedTable drivers={driverTimes.filter((time) => {
                        const now = new Date();
                        const [hours, minutes] = time.start_time.split(':');
                        const slotDateTime = new Date(time.date);
                        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        return slotDateTime >= now;
                      })}/>
                    </div>
                  )}
                  
                  {/* Past time slots */}
                  {driverTimes.filter((time) => {
                    const now = new Date();
                    const [hours, minutes] = time.start_time.split(':');
                    const slotDateTime = new Date(time.date);
                    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    return slotDateTime < now;
                  }).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        已過期運送時間
                      </h3>
                      <DriverDetailedTable drivers={driverTimes.filter((time) => {
                        const now = new Date();
                        const [hours, minutes] = time.start_time.split(':');
                        const slotDateTime = new Date(time.date);
                        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        return slotDateTime < now;
                      })}/>
                    </div>
                  )}
                  
                  {driverTimes.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <p className="text-gray-500 text-lg">尚無司機運送時間</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>    
          </Tabs>
        </div>
      </section>
    </div>
  )
}