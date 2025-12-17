import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { requireAuth, createPageUrl } from "@/utils";

export default function HeroSection({ user, openLoginModal }) {
  const navigate = useNavigate();

  const handleCreateTrip = () => {
    requireAuth(user, openLoginModal, () => {
      navigate(createPageUrl("InspirePrompt"));
    });
  };

  const userName =
    user?.preferred_name || user?.full_name?.split(" ")[0] || "traveler";

  return (
    <div className="relative flex items-center justify-center px-4 overflow-hidden py-0">
      {/* Gradient Background */}
      <div className="bg-gradient-to-b opacity-0 absolute inset-0 from-blue-950/20 via-purple-950/20 to-transparent" />

      {/* Animated Orbs */}
      <div className="absolute top-10 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-10 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {user ? (
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-1">
              <span className="bg-gradient-to-r from-[#EC4899] via-[#A855F7] to-[#8B5CF6] bg-clip-text text-transparent">
                Hi {userName}!
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-semibold max-w-xl mx-auto leading-tight mb-3">
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">
                Your next adventure starts here.
              </span>
            </p>

            <p className="text-sm md:text-base text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto mb-6">
              Explore personalized trips, curated routes from real travelers, or
              let our AI help you build something unforgettable.
            </p>

            <div className="pt-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                onClick={handleCreateTrip}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start planning with AI
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                Your journey.
              </span>{" "}
              <span className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                Your way.
              </span>{" "}
              <span className="bg-gradient-to-r from-[#EF4444] via-[#EC4899] to-[#A855F7] bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-300 max-w-xl mx-auto leading-snug">
              Discover and create personalized trips that feel like they were
              made just for you.
            </p>

            <p className="text-sm md:text-base text-white font-bold leading-snug">
              From real travelers. Curated by AI. Guided by you.
            </p>

            <div className="pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                onClick={handleCreateTrip}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create my personalized trip
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
