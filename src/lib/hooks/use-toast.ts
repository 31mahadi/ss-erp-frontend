"use client";

import * as React from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

// Cache for sonner toast to avoid repeated requires
let cachedSonnerToast: any = null;
let sonnerChecked = false;

// Lazy load sonner to avoid SSR issues
function getSonnerToast() {
  if (typeof window === "undefined") return null;
  
  // Only check once
  if (sonnerChecked) {
    return cachedSonnerToast;
  }
  
  sonnerChecked = true;
  
  try {
    // Dynamic import for client-side only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sonner = require("sonner");
    if (sonner && sonner.toast) {
      cachedSonnerToast = sonner.toast;
      return cachedSonnerToast;
    }
  } catch (error) {
    // Sonner not available - this is fine, we'll use fallback
    console.debug("Sonner not available, using console fallback", error);
  }
  
  cachedSonnerToast = null;
  return null;
}

export function useToast() {
  const showToast = React.useCallback((variant: ToastVariant, message: string, options?: ToastOptions) => {
    const { title, description } = options || {};
    const fullMessage = title ? `${title}: ${description || message}` : message;
    
    const toast = getSonnerToast();
    
    // Check if toast is available and has the required methods
    if (toast && typeof toast === "object" && 
        typeof toast.success === "function" && 
        typeof toast.error === "function") {
      const toastConfig = {
        description: description || message,
        duration: options?.duration || 3000,
      };

      try {
        switch (variant) {
          case "success":
            toast.success(title || "Success", toastConfig);
            break;
          case "error":
            toast.error(title || "Error", toastConfig);
            break;
          case "warning":
            toast.warning(title || "Warning", toastConfig);
            break;
          case "info":
            toast.info(title || "Info", toastConfig);
            break;
        }
        return;
      } catch (error) {
        // If toast call fails, fall through to console fallback
        console.warn("Toast call failed, using fallback", error);
      }
    }
    
    // Fallback to console
    const emoji = variant === "success" ? "✅" : variant === "error" ? "❌" : variant === "warning" ? "⚠️" : "ℹ️";
    console.log(`${emoji} [${variant.toUpperCase()}] ${fullMessage}`);
  }, []);

  // Always return the same structure - this ensures toast.error, toast.success etc. always exist
  const toastApi = React.useMemo(() => ({
    toast: showToast,
    success: (message: string, options?: ToastOptions) => {
      showToast("success", message, options);
    },
    error: (message: string, options?: ToastOptions) => {
      showToast("error", message, options);
    },
    warning: (message: string, options?: ToastOptions) => {
      showToast("warning", message, options);
    },
    info: (message: string, options?: ToastOptions) => {
      showToast("info", message, options);
    },
  }), [showToast]);

  return toastApi;
}

