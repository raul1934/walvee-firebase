import React from "react";
import { Utensils, Coffee, Wine, Building2, ShoppingBag, Landmark, Camera, Heart, Sparkles } from "lucide-react";

const categories = [
  { id: "all", label: "All Places", icon: Sparkles },
  { id: "restaurant", label: "Restaurants", icon: Utensils },
  { id: "cafe", label: "Cafés", icon: Coffee },
  { id: "bar", label: "Bars & Nightlife", icon: Wine },
  { id: "tourist_attraction", label: "Attractions", icon: Camera },
  { id: "museum", label: "Museums", icon: Landmark },
  { id: "shopping_mall", label: "Shopping", icon: ShoppingBag },
  { id: "lodging", label: "Hotels", icon: Building2 },
];

export default function PlaceCategoryFilter({ activeCategory, onCategoryChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-[#1A1B23] text-gray-400 hover:text-white hover:bg-[#2A2B35]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}