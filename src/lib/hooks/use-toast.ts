"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const showToast = React.useCallback((variant: ToastVariant, message: string, options?: ToastOptions) => {
    const { title, description } = options || {};
    
    // Use sonner toast directly - sonner API: toast.method(message, options)
    const toastConfig: {
      description?: string;
      duration?: number;
    } = {
      duration: options?.duration || 3000,
    };
    
    // If description is provided, use it; otherwise use message as description
    if (description) {
      toastConfig.description = description;
    }

    try {
      // Use title if provided, otherwise use message as the main text
      const toastMessage = title || message;
      
      switch (variant) {
        case "success":
          sonnerToast.success(toastMessage, toastConfig);
          break;
        case "error":
          sonnerToast.error(toastMessage, toastConfig);
          break;
        case "warning":
          sonnerToast.warning(toastMessage, toastConfig);
          break;
        case "info":
          sonnerToast.info(toastMessage, toastConfig);
          break;
      }
    } catch (error) {
      // Fallback to console if toast fails
      const emoji = variant === "success" ? "✅" : variant === "error" ? "❌" : variant === "warning" ? "⚠️" : "ℹ️";
      const fullMessage = title ? `${title}: ${description || message}` : message;
      console.error(`[Toast] Error calling toast: ${emoji} [${variant.toUpperCase()}] ${fullMessage}`, error);
    }
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

