import React, { useState } from "react";
import { User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
import { Menu, Bell, Search } from "lucide-react";
import UserAvatar from "../common/UserAvatar";
import { useQuery } from "@tanstack/react-query";
import { useGlobalSearch } from "../search/useGlobalSearch";
import SearchOverlay from "../search/SearchOverlay";
import PlaceModal from "../city/PlaceModal";

export default function Navbar({ user, onMenuClick, openLoginModal }) {
  const [logoError, setLogoError] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    retrySearch,
  } = useGlobalSearch();

  // Fetch live KPIs from user entity - with silent error handling
  const { data: liveUser } = useQuery({
    queryKey: ["userKPIs", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await User.me();
      } catch (error) {
        // Silent fail - just return the user prop
        return user;
      }
    },
    enabled: !!user?.id,
    retry: 0,
    refetchInterval: 30000,
    initialData: user,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    onError: () => {
      // Silent - don't show error to user
    },
  });

  const myTrips = liveUser?.metrics_my_trips || 0;
  const followers = liveUser?.metrics_followers || 0;
  const following = liveUser?.metrics_following || 0;

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    clearSearch();
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setIsPlaceModalOpen(true);
  };

  const handleClosePlaceModal = () => {
    setIsPlaceModalOpen(false);
    setTimeout(() => setSelectedPlace(null), 300);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[60] bg-[#0D0D0D] border-b border-[#1F1F1F]">
        <nav className="relative h-16 px-5">
          <div className="h-full grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* LEFT - Hamburger + Logo */}
            <div className="flex items-center gap-2">
              <button
                onClick={onMenuClick}
                className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                aria-label="Menu"
              >
                <Menu className="w-[22px] h-[22px] text-white" />
              </button>

              <Link to={createPageUrl("Home")} className="flex items-center">
                {!logoError ? (
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/a0788d9a8_Marca.png"
                    alt="Walvee"
                    className="h-8 w-auto"
                    onError={() => setLogoError(true)}
                    style={{ maxWidth: "120px" }}
                  />
                ) : (
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#1E66FF] to-[#8B5CF6] bg-clip-text text-transparent">
                    Walvee
                  </span>
                )}
              </Link>
            </div>

            {/* CENTER - Search Bar */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleSearchOpen}
                className="w-full max-w-md flex items-center gap-3 bg-[#1A1B23] hover:bg-[#2A2B35] border border-[#2A2B35] rounded-xl px-4 py-2 transition-all"
              >
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-gray-400 text-sm">
                  Search for travelers, cities and trips...
                </span>
              </button>
            </div>

            {/* RIGHT - KPIs + Bell + Avatar OR Login */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* KPIs - hidden on mobile - ALL USING EMAIL */}
                  <div className="hidden md:flex items-center gap-4 mr-2">
                    <Link
                      to={createProfileUrl()}
                      className="text-center hover:opacity-80 transition-opacity"
                    >
                      <div className="text-lg font-bold text-white">
                        {myTrips}
                      </div>
                      <div className="text-[10px] text-gray-400 -mt-1">
                        My Trips
                      </div>
                    </Link>

                    <Link
                      to={createProfileUrl()}
                      className="text-center hover:opacity-80 transition-opacity"
                    >
                      <div className="text-lg font-bold text-white">
                        {followers}
                      </div>
                      <div className="text-[10px] text-gray-400 -mt-1">
                        Followers
                      </div>
                    </Link>

                    <Link
                      to={createProfileUrl()}
                      className="text-center hover:opacity-80 transition-opacity"
                    >
                      <div className="text-lg font-bold text-white">
                        {following}
                      </div>
                      <div className="text-[10px] text-gray-400 -mt-1">
                        Following
                      </div>
                    </Link>
                  </div>

                  {/* Bell Icon */}
                  <button className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity">
                    <Bell className="w-5 h-5 text-white" />
                  </button>

                  {/* User Avatar - handles its own link internally */}
                  <Link to={createProfileUrl()}>
                    <UserAvatar
                      src={user.photo_url || user.picture}
                      name={user.preferred_name || user.full_name || user.email}
                      size="md"
                      ring={true}
                    />
                  </Link>
                </>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={handleSearchClose}
        query={query}
        setQuery={setQuery}
        results={results}
        isLoading={isLoading}
        error={error}
        onRetry={retrySearch}
        onPlaceClick={handlePlaceClick}
        user={user}
        openLoginModal={openLoginModal}
      />

      {/* Place Modal from Search */}
      <PlaceModal
        place={selectedPlace}
        trip={null}
        isOpen={isPlaceModalOpen}
        onClose={handleClosePlaceModal}
        user={user}
        openLoginModal={openLoginModal}
      />
    </>
  );
}
