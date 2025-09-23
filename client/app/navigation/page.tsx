"use client";
import { UnifiedNavigation } from "@/components/UnifiedNavigation";
import MapComponent from "@/components/navigation/MapComponent";
import { Suspense } from "react";

const NavigationPage: React.FC = () => {

  return (
    <div>
      <UnifiedNavigation title="導航" />
      <Suspense fallback={<div>Loading...</div>}>
        <MapComponent />
      </Suspense>
    </div>
  );
};

export default NavigationPage;
