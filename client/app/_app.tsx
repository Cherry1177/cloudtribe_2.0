import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '@/components/lib/AuthProvider';
import { UnifiedNavigation } from '@/components/UnifiedNavigation';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const isSSR = typeof window === 'undefined';

  if (isSSR) {
    return <Component {...pageProps} />;
  }

  return (
    <AuthProvider>
      <UnifiedNavigation title="CloudTribe" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
