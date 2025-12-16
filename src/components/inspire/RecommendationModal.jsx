import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CityModalContent from './CityModalContent';

export default function RecommendationModal({ isOpen, onClose, recommendation, user, openLoginModal, onAddToTrip }) {
  if (!isOpen || !recommendation) return null;

  console.log('[RecommendationModal] Rendering city modal for:', recommendation.name);

  const cityName = recommendation.country 
    ? `${recommendation.name}, ${recommendation.country}`
    : recommendation.name;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal - slides from right */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-[800px] bg-[#0C0E11] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[110] w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-colors border border-white/10"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* City content */}
          <div className="flex-1 overflow-auto">
            <CityModalContent
              cityName={cityName}
              user={user}
              openLoginModal={openLoginModal}
              onAddToTrip={onAddToTrip}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}