import React, { useEffect } from "react"
import { BasicProductInfo } from '@/interfaces/tribe_resident/seller/seller'
import { Button } from '@/components/ui/button'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"


interface sellerProp {
  products: BasicProductInfo[]
}
export const ProductTable:React.FC<sellerProp> = (prop) => {
  const router = useRouter()
  
  const handleCheckDetail:React.MouseEventHandler<HTMLButtonElement> = (event) => {
    const target = event.target as HTMLButtonElement
    const id = target.id.split('-')[1]
    
    // Ensure localStorage is only accessed on the client-side
    if (typeof window !== 'undefined') {
      localStorage.setItem('@current_seller_product_id', id)
    }
    
    router.push("/tribe_resident/seller/product_detail")

  }
  return (
    <div className="space-y-4">
      {prop.products.length > 0 ? (
        prop.products.map((product) => (
          <div key={product.id.toString()} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">上架日期: {product.upload_date}</p>
                </div>
              </div>
              <Button 
                id={'link-'+ product.id.toString()} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                onClick={handleCheckDetail}
              >
                查看詳情
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-500 text-lg">尚無商品</p>
        </div>
      )}
    </div>
  )
}