import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function CityHeader({ cityName, onCreateTrip }) {
  return (
    <div className="relative overflow-hidden min-h-[280px] flex items-center justify-center">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0C0E11]/50 to-[#0C0E11]" />
      
      {/* Animated Orbs */}
      <motion.div 
        className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.25, 0.15, 0.25]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <div className="relative z-10 container mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="w-7 h-7 text-blue-400" />
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                {cityName}
              </span>
            </h1>
          </div>

          <p className="text-gray-300 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Trips, tips, and journeys curated by travelers and locals.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-2"
          >
            <Button
              onClick={onCreateTrip}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-10 py-6 text-base font-bold rounded-2xl shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/40"
            >
              Create a trip in {cityName}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}