'use client'
import React, { useState, useEffect } from "react"
import { UnifiedNavigation } from "@/components/UnifiedNavigation";
import { ProductDetailTable } from "@/components/tribe_resident/seller/ProductDetailTable";
import SellerService from '@/services/seller/seller'
import { ProductInfo } from '@/interfaces/tribe_resident/seller/seller';
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CategorySelector } from "@/components/tribe_resident/seller/CategorySelector";
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'

export default function Page(){
  const [productInfo, setProductInfo] = useState<ProductInfo>()
  const [date, setDate] = useState<Date>()
  const [closeDialog, setCloseDialog] = useState(false)
  const router = useRouter()
  
  useEffect(()=>{
    if (typeof window !== 'undefined') {
      let product_id = localStorage.getItem('@current_seller_product_id')
    if(product_id != null){
        get_product_info(parseInt(product_id))
      }
  }
  }, [])
  const get_product_info = async(productId: Number) =>{
    const res = await SellerService.get_product_info(productId)
    setProductInfo(res)
  }
  const handleDeleteButton = () => {
    if(productInfo != undefined){
      try {
        const res = SellerService.delete_agri_product(productInfo.id)
        console.log('res:',res)
      }
      catch(e){
        console.log(e)
      }
      router.push('/tribe_resident/seller')

    }
  }
  const handleConfirm = () =>{

    try{
      if(productInfo != undefined && date != undefined){
        var res = SellerService.update_offshelf_date(productInfo.id, date.toLocaleDateString().replaceAll("/", "-"))
        setCloseDialog(true)
      }    
    }
    catch(e){
      console.log(e)
    }
    
  }
  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <UnifiedNavigation title="商品詳情" showBackButton={true} backHref="/tribe_resident/seller" />
      
      {/* Header Section */}
      <section className="py-8 bg-gradient-to-r from-[#003049] via-[#1d3557] to-[#457b9d]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">商品詳情</h1>
              <p className="text-xl text-blue-100">管理您的商品資訊和訂單</p>
            </div>
            <Link href="/tribe_resident/seller">
              <Button variant="outline" className="border-2 border-white text-blue-800 hover:bg-white hover:text-[#003049] font-semibold px-6 py-3 rounded-lg transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回商品列表
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Details Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Product Image */}
              <div className="flex justify-center">
                <div className="relative">
          <img
            src={productInfo?.img_link || '/fruit1.jpg'} 
            alt={productInfo?.name || 'Product Image'} 
                    className="w-full max-w-md h-80 object-cover rounded-xl shadow-lg"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    在售中
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{productInfo?.name}</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">商品價格</p>
                        <p className="text-2xl font-bold text-gray-900">${String(productInfo?.price || 0)} / {productInfo?.unit || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">商品總數量</p>
                        <p className="text-2xl font-bold text-gray-900">{String(productInfo?.total_quantity || 0)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">下架日期</p>
                        <p className="text-2xl font-bold text-gray-900">{productInfo?.off_shelf_date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-0 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  onClick={()=>setCloseDialog(false)}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    修改下架日期
                </Button>
              </DialogTrigger>

                    <DialogContent className="lg:max-w-[600px] max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">修改下架日期</DialogTitle>
                        <DialogDescription className="text-gray-600">
                    其他商品資訊無法修改，如果尚未有購買者，請刪除商品並重新上架。
                    如果已有購買者，請自行更改下架日期並重新上架商品。
                  </DialogDescription>
                </DialogHeader>

                      <div className="py-6">
                        <Label className="text-lg font-semibold mb-4 block">
                          選擇新的下架日期
                      </Label>
                        <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                            className="rounded-lg border bg-white shadow-sm"
                        />
                      </div>
                    </div>

                      {closeDialog != true && (
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg" 
                            onClick={handleConfirm}
                          >
                            確認修改
                          </Button>
                        </DialogFooter>
                      )}
                      
                      {closeDialog && (
                <div>
                          <Alert className="bg-green-100 border-green-200 mb-4">
                            <AlertDescription className="text-green-800 text-lg font-semibold text-center">
                    修改成功!!
                  </AlertDescription>
                  </Alert>
                          <DialogFooter>
                    <DialogClose asChild>
                              <Button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg">
                                關閉
                              </Button>
                    </DialogClose>     
                  </DialogFooter>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        刪除商品
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">確定要刪除此商品嗎？</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          此動作無法復原，請確認後再操作。刪除後將無法恢復商品資訊。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-2 rounded-lg">
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteButton}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg"
                        >
                          確認刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">訂單管理</h2>
            <ProductDetailTable />
        </div>
      </div>
      </section>
    </div>
  )

}
