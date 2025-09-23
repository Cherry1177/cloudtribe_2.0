import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeSlot } from '@/interfaces/driver/driver';

/**
 * Represents a card displaying the driver's available time slot.
 */
const TimeCard: React.FC<{ timeSlot: TimeSlot, onDelete: () => void }> = ({ timeSlot, onDelete }) => {
  const { driver_name, driver_phone, date, start_time, locations } = timeSlot;

  // Check if the time slot has passed
  const isTimeSlotPassed = () => {
    const now = new Date();
    const [hours, minutes] = start_time.split(':');
    const slotDateTime = new Date(date);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return slotDateTime < now;
  };

  const isPassed = isTimeSlotPassed();

  return (
    <Card className={`max-w-md mx-auto my-4 shadow-lg ${isPassed ? 'opacity-60' : ''}`}>
      <CardHeader className={`p-4 rounded-t-md ${isPassed ? 'bg-gray-500' : 'bg-black'} text-white`}>
        <CardTitle className="text-lg font-bold flex items-center">
          {isPassed && <span className="mr-2">⏰</span>}
          司機可用時間
          {isPassed && <span className="ml-2 text-sm">(已過期)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className={`p-4 ${isPassed ? 'relative' : ''}`}>
        {isPassed && (
          <div className="absolute inset-0 bg-gray-200 opacity-50 flex items-center justify-center">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform -rotate-12">
              時間已過
            </div>
          </div>
        )}
        <div className="mb-2">
          <p className={`text-sm font-bold ${isPassed ? 'line-through text-gray-500' : ''}`}>
            司機名稱: {driver_name}
          </p>
          <p className={`text-sm ${isPassed ? 'line-through text-gray-500' : ''}`}>
            電話: {driver_phone}
          </p>
        </div>
        <div className="mb-2">
          <p className={`text-sm font-bold ${isPassed ? 'line-through text-gray-500' : ''}`}>
            日期: {date}
          </p>
          <p className={`text-sm ${isPassed ? 'line-through text-gray-500' : ''}`}>
            開始時間: {start_time}
          </p>
        </div>
        <div className="mb-2">
          <p className={`text-sm font-bold ${isPassed ? 'line-through text-gray-500' : ''}`}>
            地點: {locations}
          </p>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-100 p-4 rounded-b-md flex justify-between">
        <Button 
          className={`${isPassed ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500'} text-white`}
          onClick={onDelete}
          disabled={isPassed}
        >
          {isPassed ? '已過期' : '刪除'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TimeCard;
