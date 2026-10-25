import React from "react";
import { useShop } from "../context/ShopContext";

export default function Toast() {
  const { toast } = useShop();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-[#111111] text-[#faf9f6] border border-[#333333] shadow-2xl px-5 py-3.5 flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-secondary">
          {toast.type === "error" ? "error" : toast.type === "info" ? "info" : "check_circle"}
        </span>
        <span className="text-xs font-medium tracking-wide">
          {toast.message}
        </span>
      </div>
    </div>
  );
}
