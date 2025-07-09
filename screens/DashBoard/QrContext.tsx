// context/QrContext.tsx
import React, { createContext, useContext, useState } from 'react';

type QrContextType = {
  scannedValue: string;
  setScannedValue: (value: string) => void;
};

const QrContext = createContext<QrContextType | undefined>(undefined);

export const QrProvider = ({ children }: { children: React.ReactNode }) => {
  const [scannedValue, setScannedValue] = useState('');

  return (
    <QrContext.Provider value={{ scannedValue, setScannedValue }}>
      {children}
    </QrContext.Provider>
  );
};

export const useQr = () => {
  const context = useContext(QrContext);
  if (!context) throw new Error('useQr must be used within QrProvider');
  return context;
};
