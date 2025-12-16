import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const INTERESTS = [
  'Adventure', 'Sports', 'Gastronomy', 'Ecotourism', 'Experiential travel', 'Cultural', 'History'
];

const GASTRONOMY_SUB = [
  'Low budget', 'Fine dining', 'Vegan / Vegetarian', 'More meat', 'Seafood', 'Regional specialties', 'Michelin stars', 'Street food'
];

const ECOTOURISM_SUB = [
  'More land', 'Wildlife watching', 'Hiking', 'More sea', 'Safaris', 'Eco-farms', 'Local culture'
];

const EXPERIENTIAL_SUB = [
  'More nature', 'More sea', 'Photos', 'History', 'Urban exploration', 'Nightlife', 'More relaxation', 'More adventure'
];

const CULTURAL_SUB = [
  'Museums', 'Archaeological sites', 'Photos', 'Historical sites', 'Historical tours', 'Natural parks', 'Cultural events'
];

const BUDGETS = ['Budget', 'Mid-range', 'Comfortable', 'Luxury'];
const PACES = ['Relaxed', 'Moderate', 'Fast-paced'];
const COMPANIONS = ['Solo', 'Couple', 'Family', 'Friends', 'Group'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'Flexible'];

export default function FiltersModal({ isOpen, onClose, selectedFilters, onApply }) {
  const [filters, setFilters] = useState(selectedFilters);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const toggleInterest = (interest) => {
    const current = filters.interests || [];
    if (current.includes(interest)) {
      setFilters({ ...filters, interests: current.filter(i => i !== interest) });
    } else {
      setFilters({ ...filters, interests: [...current, interest] });
    }
  };

  const toggleExpanded = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getSubCategories = (category) => {
    switch(category) {
      case 'Gastronomy': return GASTRONOMY_SUB;
      case 'Ecotourism': return ECOTOURISM_SUB;
      case 'Experiential travel': return EXPERIENTIAL_SUB;
      case 'Cultural': return CULTURAL_SUB;
      default: return [];
    }
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      interests: [],
      budget: null,
      pace: null,
      companions: null,
      season: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-[#1A1B23] rounded-2xl border border-[#2A2B35] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2B35]">
          <h2 className="text-xl font-semibold text-white">Trip Preferences</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interests */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Interests</h3>
            <div className="space-y-2">
              {INTERESTS.map(interest => {
                const hasSubCategories = getSubCategories(interest).length > 0;
                const isSelected = filters.interests?.includes(interest);
                const isExpanded = expandedCategory === interest;

                return (
                  <div key={interest}>
                    <button
                      onClick={() => hasSubCategories ? toggleExpanded(interest) : toggleInterest(interest)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-500/15 border-blue-500/40 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8'
                      }`}
                    >
                      <span>{interest}</span>
                      {hasSubCategories && (
                        <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                      )}
                    </button>

                    {/* Sub-categories */}
                    <AnimatePresence>
                      {isExpanded && hasSubCategories && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-4 mt-2 space-y-2 overflow-hidden"
                        >
                          {getSubCategories(interest).map(sub => {
                            const isSubSelected = filters.interests?.includes(sub);
                            return (
                              <button
                                key={sub}
                                onClick={() => toggleInterest(sub)}
                                className={`w-full px-4 py-2 rounded-lg border text-sm transition-all ${
                                  isSubSelected
                                    ? 'bg-purple-500/15 border-purple-500/40 text-white'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8'
                                }`}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Budget</h3>
            <div className="grid grid-cols-2 gap-2">
              {BUDGETS.map(budget => (
                <button
                  key={budget}
                  onClick={() => setFilters({ ...filters, budget: filters.budget === budget ? null : budget })}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    filters.budget === budget
                      ? 'bg-green-500/15 border-green-500/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8'
                  }`}
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Travel Pace</h3>
            <div className="grid grid-cols-3 gap-2">
              {PACES.map(pace => (
                <button
                  key={pace}
                  onClick={() => setFilters({ ...filters, pace: filters.pace === pace ? null : pace })}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    filters.pace === pace
                      ? 'bg-blue-500/15 border-blue-500/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8'
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>

          {/* Companions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Traveling With</h3>
            <div className="grid grid-cols-3 gap-2">
              {COMPANIONS.map(comp => (
                <button
                  key={comp}
                  onClick={() => setFilters({ ...filters, companions: filters.companions === comp ? null : comp })}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    filters.companions === comp
                      ? 'bg-purple-500/15 border-purple-500/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Preferred Season</h3>
            <div className="grid grid-cols-3 gap-2">
              {SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => setFilters({ ...filters, season: filters.season === season ? null : season })}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    filters.season === season
                      ? 'bg-orange-500/15 border-orange-500/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#2A2B35]">
          <Button
            onClick={handleReset}
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            Reset All
          </Button>
          
          <Button
            onClick={handleApply}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white"
          >
            Apply Filters
          </Button>
        </div>
      </motion.div>
    </div>
  );
}