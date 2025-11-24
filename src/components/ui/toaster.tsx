"use client";

let SonnerToaster: any = null;

try {
  SonnerToaster = require("sonner").Toaster;
} catch {
  // Sonner not available
}

export function Toaster() {
  if (!SonnerToaster) {
    return null; // Don't render if sonner is not available
  }
  
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  );
}

