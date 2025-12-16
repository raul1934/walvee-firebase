import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlaceDetails from "../trip/PlaceDetails";

export default function PlaceModal({ place, trip, isOpen, onClose, user, openLoginModal }) {
  // Log on every render
  console.log('[PlaceModal] ===== RENDER =====');
  console.log('[PlaceModal] Props:', {
    isOpen,
    hasPlace: !!place,
    placeName: place?.name,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasOpenLoginModal: !!openLoginModal,
    openLoginModalType: typeof openLoginModal
  });

  if (!isOpen || !place) {
    console.log('[PlaceModal] Not rendering - isOpen:', isOpen, 'hasPlace:', !!place);
    return null;
  }

  console.log('[PlaceModal] Rendering modal for place:', place.name);

  const tripData = trip || {
    destination: place.address,
    id: 'city-modal'
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-[#0D0D0D] rounded-2xl shadow-2xl overflow-hidden border border-[#1F1F1F]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md flex items-center justify-center transition-colors border border-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="overflow-y-auto max-h-[90vh]">
            <PlaceDetails
              place={place}
              trip={tripData}
              onClose={onClose}
              user={user}
              openLoginModal={openLoginModal}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}