import React, { useState } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Popular cities for quick selection
const POPULAR_CITIES = [
  { name: 'Paris', country: 'France', emoji: '🇫🇷' },
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵' },
  { name: 'New York', country: 'USA', emoji: '🇺🇸' },
  { name: 'Barcelona', country: 'Spain', emoji: '🇪🇸' },
  { name: 'Bali', country: 'Indonesia', emoji: '🇮🇩' },
  { name: 'Rio de Janeiro', country: 'Brazil', emoji: '🇧🇷' },
  { name: 'London', country: 'UK', emoji: '🇬🇧' },
  { name: 'Dubai', country: 'UAE', emoji: '🇦🇪' },
  { name: 'Sydney', country: 'Australia', emoji: '🇦🇺' },
  { name: 'Rome', country: 'Italy', emoji: '🇮🇹' },
  { name: 'Bangkok', country: 'Thailand', emoji: '🇹🇭' },
  { name: 'Istanbul', country: 'Turkey', emoji: '🇹🇷' },
];

export default function CitiesModal({ isOpen, onClose, onSelectCity }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (cityName) => {
    onSelectCity(cityName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-2xl max-h-[75vh] bg-[#1A1B23] rounded-2xl border border-[#2A2B35] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2B35]">
          <h2 className="text-xl font-semibold text-white">Select a City</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[#2A2B35]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-blue-500/40 focus:bg-white/8 transition-all"
            />
          </div>
        </div>

        {/* Cities Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCities.map(city => (
              <button
                key={city.name}
                onClick={() => handleSelect(city.name)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-blue-500/40 transition-all group"
              >
                <span className="text-3xl">{city.emoji}</span>
                <span className="text-white font-medium text-sm">{city.name}</span>
                <span className="text-gray-500 text-xs">{city.country}</span>
              </button>
            ))}
          </div>

          {filteredCities.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No cities found</p>
              <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}