'use client';
import React, { useState, useEffect } from 'react';
import { LOCATIONS } from '@/constants/constants';
import UserService from '@/services/user/user';
import { UnifiedNavigation } from '@/components/UnifiedNavigation';
import { User } from '@/interfaces/user/user';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Page() {
  const [selectedLocation, setSelectedLocation] = useState('empty');
  const [originLocation, setOriginLocation] = useState('');
  const [user, setUser] = useState<User>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalPhoneInput, setModalPhoneInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const _user = UserService.getLocalStorageUser();
      setUser(_user);
      setName(_user.name);
      setPhone(_user.phone);
      setOriginLocation(_user.location);
      setSelectedLocation(_user.location);
    }
  }, []);

  const handleStartUpdate = () => {
    setShowModal(true);
  };

  const handleVerifyPhone = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/verify-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: modalPhoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        alert('電話號碼驗證失敗，請重新輸入正確電話號碼。');
        return;
      }

      setShowModal(false);
      setModalPhoneInput('');
      setIsUpdating(true);
    } catch (e) {
      console.error(e);
      alert('驗證過程發生錯誤');
    }
  };

  const handleSaveButton = async () => {
    if (user) {
      try {
        if (name !== user.name) {
          await UserService.update_profile(user.id, { name });
        }

        if (selectedLocation !== originLocation) {
          await UserService.update_nearest_location(user.id, selectedLocation);
          setOriginLocation(selectedLocation);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('@user', JSON.stringify({
            ...user,
            name,
            location: selectedLocation
          }));
        }

        alert('資料更新成功！');
      } catch (e) {
        console.error(e);
        alert('資料更新失敗！');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    if (phone.length <= 2) return phone + '*'.repeat(Math.max(0, phone.length - 2));
    return phone.slice(0, 2) + '*'.repeat(phone.length - 2);
  };

  return (
    <>
      <UnifiedNavigation title="設定" />

      <div className="min-h-screen bg-gray-50 py-6 px-4">
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80 space-y-4">
              <h2 className="text-lg font-bold">電話號碼確認</h2>
              <Input
                placeholder="請輸入您的電話號碼"
                value={modalPhoneInput}
                onChange={(e) => setModalPhoneInput(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setModalPhoneInput('');
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleVerifyPhone}>
                  確認
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Card className="w-full max-w-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">個人基本資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>姓名</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isUpdating}
                />
              </div>

              <div>
                <Label>電話號碼</Label>
                <Input
                  value={maskPhone(phone)}
                  disabled
                />
              </div>

              <div>
                <Label>離居住地最近的地點</Label>
                <Select
                  onValueChange={setSelectedLocation}
                  value={selectedLocation}
                  disabled={!isUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇地點" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {LOCATIONS.map((place) => (
                        <SelectItem key={place.id} value={place.value}>
                          {place.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-4 mt-4">
                {!isUpdating && (
                  <Button onClick={handleStartUpdate}>更改資訊</Button>
                )}
                {isUpdating && (
                  <Button onClick={handleSaveButton}>儲存</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
