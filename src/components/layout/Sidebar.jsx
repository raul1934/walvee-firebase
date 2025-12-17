import React from "react";
import { User } from "@/api/entities";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
export default function Sidebar({ isOpen, onClose, user, openLoginModal }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      onClose();
      await User.signOut();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 bg-black/35 z-[65] transition-opacity duration-250 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-[300px] lg:w-[340px] xl:w-[386px] bg-[#0D0D0D] z-[70] transform transition-transform duration-250 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-5 overflow-y-auto">
          {user ? (
            <>
              {/* CTA */}
              <button
                className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#EC4899] text-white font-bold rounded-lg hover:opacity-90 transition-opacity mb-4"
                onClick={() => {
                  onClose();
                  // Navigate to create trip
                }}
              >
                Create my personalized trip
              </button>

              {/* Navigation Links */}
              <nav className="flex-1 flex flex-col">
                <Link
                  to={createProfileUrl()}
                  className="text-white text-base py-[7px] hover:opacity-85 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                  onClick={onClose}
                >
                  My Trips
                </Link>

                <Link
                  to={createPageUrl("EditProfile")}
                  className="text-white text-base py-[7px] hover:opacity-85 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                  onClick={onClose}
                >
                  Edit profile
                </Link>

                <Link
                  to={createPageUrl("ApiDashboard")}
                  className="text-white text-base py-[7px] hover:opacity-85 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                  onClick={onClose}
                >
                  API Monitoring
                </Link>

                <Link
                  to={createPageUrl("Home")}
                  className="text-white text-base py-[7px] hover:opacity-85 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                  onClick={onClose}
                >
                  About us
                </Link>

                {/* Sign Out */}
                <div className="mt-auto pt-5">
                  <button
                    className="text-white text-base underline hover:opacity-85 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <>
              {/* CTA for non-logged users */}
              <button
                className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#EC4899] text-white font-bold rounded-lg hover:opacity-90 transition-opacity mb-8"
                onClick={() => {
                  onClose();
                  if (openLoginModal) openLoginModal();
                }}
              >
                Create my personalized trip
              </button>

              {/* Headline */}
              <div className="mb-6">
                <h2 className="text-[28px] lg:text-[32px] font-bold leading-tight mb-3 text-white max-w-[24ch]">
                  <span className="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                    Create and share unforgettable journeys.
                  </span>
                </h2>
                <p className="text-[#9CA3AF] text-base font-medium">
                  Your next adventure starts here.
                </p>
              </div>

              {/* Login Button */}
              <button
                className="w-full h-12 bg-[#1E66FF] hover:bg-[#0056b3] text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E66FF] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]"
                onClick={() => {
                  onClose();
                  if (openLoginModal) openLoginModal();
                }}
              >
                Log in or create your Walvee account
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
