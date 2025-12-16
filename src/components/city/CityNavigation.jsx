
import React, { useState, useEffect } from "react";
import { Map, Heart, Users, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import CitySearch from "./CitySearch";
import PlaceCategoryFilter from "./PlaceCategoryFilter";

const tabs = [
{ id: "all", label: "All Trips", icon: Map },
{ id: "places", label: "Top Places", icon: Sparkles },
{ id: "locals", label: "Locals", icon: Users },
{ id: "favorites", label: "Favorites", icon: Heart }];


export default function CityNavigation({ activeTab, onTabChange, cityName, onCreateTrip, placeCategory, onCategoryChange }) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Split city name into city and country
  const [city, country] = cityName?.split(',').map((s) => s.trim()) || [cityName, ''];

  return (
    <div className={`transition-all duration-300 ${
    isSticky ?
    'fixed top-16 left-0 right-0 z-50 bg-[#0C0E11]/95 backdrop-blur-xl border-b border-[#1F1F1F] shadow-lg' :
    'relative'}`
    }>
      {/* Gradient Background - only when sticky */}
      {isSticky &&
      <>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0E11]/50 to-[#0C0E11]" />
          
          {/* Animated Orbs */}
          <motion.div
          className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }} />

          <motion.div
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.25, 0.15, 0.25]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }} />

        </>
      }

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col gap-3 py-3">
          {/* City name and Search - only shows when sticky */}
          {isSticky && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                    {cityName}
                  </span>
                </h2>
              </div>

              {/* Campo de busca à direita do nome */}
              <div className="flex-shrink-0 w-full max-w-md">
                <CitySearch cityName={cityName} inline={true} />
              </div>
            </div>
          )}

          {/* Tabs and CTA */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
            {/* Filtros à esquerda */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-[#1A1B23] text-gray-400 hover:text-white hover:bg-[#2A2B35]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CTA à direita dos filtros */}
            {isSticky && (
              <Button
                onClick={onCreateTrip}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-6 py-2.5 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105 flex-shrink-0"
              >
                Create trip in {city}
              </Button>
            )}
          </div>

          {/* Category Filter - only shows when on places tab */}
          {activeTab === "places" && (
            <div className="border-t border-[#1F1F1F] pt-2.5 -mb-1">
              <PlaceCategoryFilter 
                activeCategory={placeCategory}
                onCategoryChange={onCategoryChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
