
import React from "react";
import { X, Infinity, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UserAvatar from "../common/UserAvatar";

export default function StealModal({ isOpen, onClose, onConfirm, trip, isLoading }) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-labelledby="steal-modal-title"
      aria-describedby="steal-modal-description"
    >
      <div 
        className="relative w-full max-w-lg bg-[#111827] rounded-2xl p-6 border border-[#2A2B35] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Infinity className="w-8 h-8 text-white" />
          </div>
          
          <h2 id="steal-modal-title" className="text-2xl font-bold text-center text-white mb-2">
            Ready to make it yours?
          </h2>
          
          <p id="steal-modal-description" className="text-gray-400 text-center text-sm leading-relaxed">
            You're about to copy this trip into your profile. You'll be able to edit everything freely — while giving credit to the original creator. Each trip derived from another will carry a badge showing its origin.
          </p>
        </div>

        {/* Badge Preview - USING EMAIL */}
        <div className="bg-[#0D0D0D] rounded-xl p-4 mb-6 border border-[#2A2B35]">
          <p className="text-xs text-gray-500 mb-2">This trip will show:</p>
          <Link
            to={`${createPageUrl("Profile")}?email=${encodeURIComponent(trip.created_by)}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <UserAvatar
              src={trip.author_photo}
              name={trip.author_name}
              size="sm"
              email={trip.created_by}
            />
            <span className="text-sm text-gray-300">
              Inspired by <span className="text-blue-400 font-semibold hover:text-blue-300">@{trip.author_name?.split(' ')[0] || 'Traveler'}</span>
            </span>
          </Link>
        </div>

        {/* Checklist */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">
              We'll copy the structure, days, and places from the original trip.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">
              Your edits won't affect the original itinerary.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-blue-400" />
            </div>
            <p className="text-sm text-gray-300">
              Your version will start as private — you control its visibility.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
