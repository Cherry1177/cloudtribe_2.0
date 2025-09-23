import React, { useEffect } from "react"
import { DriverTimeDetail } from '@/interfaces/driver/driver'
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


interface driverProp {
  drivers: DriverTimeDetail[]
}
export const DriverDetailedTable:React.FC<driverProp> = (prop) => {
  
  // Function to check if a time slot has passed
  const isTimeSlotPassed = (date: string, startTime: string) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':');
    const slotDateTime = new Date(date);
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return slotDateTime < now;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="flex flex-row w-screen">
          <TableHead className="text-center lg:text-lg text-md w-1/4">司機姓名</TableHead>
          <TableHead className="text-center lg:text-lg text-md w-1/4">運送日期</TableHead>
          <TableHead className="text-center lg:text-lg text-md w-1/4">運送時間</TableHead>
          <TableHead className="text-center lg:text-lg text-md w-1/4">起始點</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody> 
        {prop.drivers.map((driver) => {
          const isPassed = isTimeSlotPassed(driver.date, driver.start_time);
          
          return (
            <TableRow 
              key={driver.id.toString()} 
              className={`flex flex-row items-center ${isPassed ? 'opacity-60 bg-gray-100' : ''}`}
            >
              <TableCell className={`text-center lg:text-lg text-md text-balance w-1/4 ${isPassed ? 'line-through text-gray-500' : ''}`}>
                {isPassed && <span className="mr-2">⏰</span>}
                {driver.driver_name}
                {isPassed && <span className="ml-2 text-sm text-red-500">(已過期)</span>}
              </TableCell>
              <TableCell className={`text-center lg:text-lg text-md text-balance w-1/4 ${isPassed ? 'line-through text-gray-500' : ''}`}>
                {driver.date}
              </TableCell>
              <TableCell className={`text-center lg:text-lg text-md text-balance w-1/4 ${isPassed ? 'line-through text-gray-500' : ''}`}>
                {driver.start_time}
              </TableCell>
              <TableCell className={`text-center lg:text-lg text-md text-balance w-1/4 ${isPassed ? 'line-through text-gray-500' : ''}`}>
                {driver.locations}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      
    </Table>
  )
}