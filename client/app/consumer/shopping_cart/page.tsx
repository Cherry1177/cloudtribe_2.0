'use client'
import React, { useEffect, useState, useRef } from "react"
import { Button } from '@/components/ui/button'
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { UnifiedNavigation } from '@/components/UnifiedNavigation'
import ConsumerService from '@/services/consumer/consumer'
import UserService from '@/services/user/user'
import SellerService from '@/services/seller/seller'
import { User } from '@/interfaces/user/user';
import { CartItem } from '@/interfaces/tribe_resident/seller/seller';
import { PurchasedProductRequest } from '@/interfaces/consumer/consumer';
import { useRouter } from 'next/navigation'
import { useJsApiLoader, LoadScriptProps } from "@react-google-maps/api";
import Link from "next/link"
const libraries: LoadScriptProps['libraries'] = ["places"];

// Custom hook for debouncing input values
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
// Format prediction description
const formatPredictionDisplay = (prediction: google.maps.places.AutocompletePrediction) => {
  const businessName = prediction.structured_formatting.main_text;
  const address = prediction.structured_formatting.secondary_text;

  return {
    businessName: businessName || '',
    address: address || ''
  };
};

export default function ShoppingCart(){
  const [user, setUser] = useState<User>()
  const [cart, setCart] = useState<CartItem[]>([])
  const [changedQuantity, setChangedQuantity] = useState([])
  const [check, setCheck] = useState<string[]>([])
  const [message, setMessage] = useState('empty')
  const [location, setLocation] = useState<string>("empty");
  const [searchInput, setSearchInput] = useState<string>("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isManualInput, setIsManualInput] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter()
  
  // Initialize debounced search term
  const debouncedSearchTerm = useDebounce(searchInput, 1000);

  // Service references for Google Places API
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    language: 'zh-TW'
  });

  // Initialize Google Places services
  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService.current = new google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  // Fetch predictions when search term changes
  useEffect(() => {
    if (isManualInput && debouncedSearchTerm && autocompleteService.current) {
      const searchQuery = {
        input: debouncedSearchTerm,
        language: 'zh-TW',
        componentRestrictions: { country: 'tw' },
        types: ['establishment']
      };

      autocompleteService.current.getPlacePredictions(
        searchQuery,
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  }, [debouncedSearchTerm, isManualInput]);

  useEffect(()=>{
    const _user = UserService.getLocalStorageUser()
    if(_user.name == 'empty'){
      router.replace('/login')
    }   
    setUser(_user)
    setChangedQuantity([])
    get_shopping_cart_items(_user.id)
  }, [router, message]) // Add 'router' to the dependency array
  
  const get_shopping_cart_items = async(userId: Number) => {
    try{
      const cart_items:CartItem[] = await ConsumerService.get_shopping_cart_items(userId)
      setCart(cart_items)
    }
    catch(e){
      console.log(e)
    }
  }
  const handleDeleteButton = (itemId: Number) => {
    try {
      const res = ConsumerService.delete_shopping_cart_item(itemId)
      setCart(cart.filter((item) => item.id != itemId))
    }
    catch(e){
      console.log(e)
    } 

  }
  const handleQuantityInput: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setChangedQuantity({...changedQuantity, [event.target.id.split('-')[1]]:event.target.value})
  }
  
  const storeChangedQuantity = async() => {
    for(var key in changedQuantity){
      try{
        const res = await ConsumerService.update_shopping_cart_quantity(parseInt(key), changedQuantity[key])
      }
      catch(e){
        console.log(e)
      }  
    }  
  }
  const handlePurchaseButton = async() =>{
    if(check.length == 0){
      setMessage('請勾選商品')
      setTimeout(() => setMessage('empty'), 2000)
    }
    else if(location=='empty'){
      setMessage('請先設定取貨地點')
      setTimeout(() => setMessage('empty'), 3500)
    }
    else{
      storeChangedQuantity()
      check.map(async(checkedItemId)=> {
        let item = cart.find((item) => item.id.toString() == checkedItemId)
        if(item != undefined && user != undefined){
          try{
            //const res_product = await SellerService.get_product_info(item?.id)
            let req: PurchasedProductRequest = {
              seller_id: item?.seller_id,
              buyer_id: user?.id,
              buyer_name: user?.name,
              produce_id: item?.produce_id,
              quantity: item?.quantity,
              starting_point: item?.location,
              end_point: location,
            }
            const res_order = await ConsumerService.add_product_order(req) 
            const res_cart_status = await ConsumerService.update_shopping_cart_status(item?.id)
          
          }
          catch(e){
            console.log(e)
          }
        }
      })
      setMessage('成功訂購商品')
      if(user != undefined)
        get_shopping_cart_items(user.id)
      setTimeout(() => setMessage('empty'), 2000)  
    }
  }
  const handleCheckBox: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    const target = event.target as HTMLButtonElement
    const id = target.id.split('-')[1]
    if(check.includes(id))
      setCheck(check.filter((element) => element != id))
    else
      check.push(id)
  }
   // Handle place selection
   const handlePlaceSelect = (placeId: string) => {
    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['formatted_address', 'name']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const fullAddress = `${place.name} ${place.formatted_address}`;
            setLocation(fullAddress);
            setSearchInput(fullAddress);
            setIsManualInput(false); 
            setPredictions([]);
            setError(null);
          } else {
            setError("無法獲取地點詳細資訊");
          }
        }
      );
    }
  };

  // Handle input change for search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setIsManualInput(true);
    if (!value) {
      setPredictions([]);
    }
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <UnifiedNavigation title="購物車" showBackButton={true} backHref="/consumer" />
      
      {/* Alert Message */}
      {message != 'empty' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert className="bg-gradient-to-r from-yellow-300 to-orange-300 text-black border-0 shadow-lg">
            <AlertDescription className="lg:text-lg text-md font-medium">
              {message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 hover:scale-105"
            onClick={storeChangedQuantity}
          >
            <Link href="/consumer" className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>返回商品頁面</span>
            </Link>
          </Button>
          
          <Button 
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={handlePurchaseButton}
          >
            購買勾選商品
          </Button>
        </div>
      </div>

      {/* Pickup Location Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <label className="block text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>取貨地點</span>
          </label>
          <div className="relative">
            <Input
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              placeholder="請輸入取貨地點"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            {predictions.length > 0 && (
              <div className="absolute z-50 w-full bg-white mt-2 rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-auto">
                {predictions.map((prediction) => {
                  const { businessName, address } = formatPredictionDisplay(prediction);
                  return (
                    <div
                      key={prediction.place_id}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                      onClick={() => handlePlaceSelect(prediction.place_id)}
                    >
                      <div className="font-semibold text-gray-900">{businessName}</div>
                      <div className="text-sm text-gray-600">{address}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {location != 'empty' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-800">已選擇地點:</span>
              </div>
              <div className="text-sm text-green-700 mt-1">{location}</div>
            </div>
          )}
        </div>
      </div>

      
      {/* Cart Items Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span>購物車商品</span>
          </h2>
          
          <div className="grid lg:grid-cols-3 grid-cols-1 gap-6">
            {cart.map((item)=>
              <div key={item.id.toString()} className="flex flex-row w-full lg:h-[150px] h-[120px] items-center bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="w-1/12 flex justify-center">
                  <Checkbox 
                    id={`check-${item.id}`} 
                    className="h-5 w-5"
                    onClick={handleCheckBox}/>
                </div>
                <div className="w-3/12">
                  <img
                    src={item.img_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                </div> 
                <div className="flex flex-col w-5/12 px-3">
                  <p className="text-sm lg:text-base font-semibold text-gray-800 mb-1 line-clamp-2">{item.name}</p>
                  <p className="text-xs lg:text-sm text-red-600 font-medium">${item.price.toString()} / {item.unit}</p>
                </div>
                <div className="w-2/12">
                  <Input
                    type="number" 
                    id={`quantity-${item.id}`}
                    className="w-full text-center h-8 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    defaultValue={item.quantity.toString()} 
                    onChange={handleQuantityInput}
                    min={1}/>
                </div>
                <div className="w-1/12 flex justify-center">
                  <Button 
                    variant="outline" 
                    id={`delete-${item.id}`}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                    onClick={() => handleDeleteButton(item.id)}>
                    <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>

  )
}