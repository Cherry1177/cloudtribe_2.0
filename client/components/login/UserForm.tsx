import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/lib/AuthProvider';
import UserService from '@/services/user/user'

/**
 * UserForm component for registering and logging in users.
 */
export function UserForm() {
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  // UseEffect to check localStorage
  useEffect(() => {
    // Check if it is client side
    if (typeof window !== 'undefined') {   // From localStorage to get the last phone number
      const lastPhone = localStorage.getItem('lastPhone');
      if (lastPhone) {
        setPhone(lastPhone);
      }
    }
  }, []);


  /**
   * Handles the login process when the user clicks the "登入" button.
   */
  const handleLogin = async () => {
    // clear error and success messages
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try{
      const res_login = await UserService.login(phone)
      if(res_login == "user not found") {
        setErrorMessage('電話輸入錯誤')
      } else {
        setUser(res_login)
        localStorage.setItem('@user', JSON.stringify(res_login))
        setSuccessMessage('登入成功！正在跳轉...')
        
        // Redirect to main page after successful login
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }  
    }
    catch(e){
      setErrorMessage('登入過程中出現錯誤');
      console.log(e)
    } finally {
      setIsLoading(false);
    }

    // store the phone number in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastPhone', phone);
    }
  };

  const handleAddLineBot = () => {
    //window.open('https://page.line.me/261lgfkv', '_blank');
    window.open('https://page.line.me/240cyafu', '_blank');
    // window.open('https://www.cloudtribe.site/callback', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Registration Button */}
      <Button 
        onClick={handleAddLineBot}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <span>首次註冊</span>
      </Button>

      {/* Login Form */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">登入</h3>
          <p className="text-gray-600 text-sm">請輸入您的電話號碼登入</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">電話號碼</Label>
            <Input 
              id="phone" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="請輸入電話號碼"
              className="h-12 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <Alert className="bg-red-50 border-red-200 text-red-800 rounded-xl">
              <AlertTitle className="text-red-800">錯誤</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800 rounded-xl">
              <AlertTitle className="text-green-800">成功</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Login Button */}
          <Button 
            onClick={handleLogin}
            disabled={isLoading || !phone.trim()}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>登入中...</span>
              </div>
            ) : (
              '登入'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default UserForm;
