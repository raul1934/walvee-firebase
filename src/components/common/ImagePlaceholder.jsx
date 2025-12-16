import React from "react";
import { Image as ImageIcon, MapPin } from "lucide-react";

export default function ImagePlaceholder({ type = "image", className = "" }) {
  const Icon = type === "map" ? MapPin : ImageIcon;
  
  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-[#1A1B23] via-[#0D0D0D] to-[#1A1B23] flex items-center justify-center ${className}`}>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(to right, #3B82F6 1px, transparent 1px),
          linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      
      {/* Icon */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-blue-500/20">
          <Icon className="w-8 h-8 text-blue-400/60" />
        </div>
        <p className="text-xs text-gray-600 font-medium">No image available</p>
      </div>
    </div>
  );
}