import React from "react";
import { User } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl, createProfileUrl } from "@/utils";
import { Users } from "lucide-react";
import UserAvatar from "../common/UserAvatar";

export default function CityLocals({ cityName }) {
  // Fetch all users who live in this city
  const { data: locals = [], isLoading } = useQuery({
    queryKey: ['cityLocals', cityName],
    queryFn: async () => {
      try {
        const isAuthenticated = await User.isAuthenticated();
        if (!isAuthenticated) {
          console.log('[CityLocals] User not authenticated');
          return [];
        }

        console.log('[CityLocals] Fetching users for city:', cityName);
        const allUsers = await User.list();
        console.log('[CityLocals] Total users:', allUsers.length);
        
        // Normalize city name for comparison
        const normalizedCityName = cityName?.toLowerCase().trim() || '';
        const cityNameOnly = normalizedCityName.split(',')[0].trim();
        
        // Filter users who live in this city
        const filtered = allUsers.filter(user => {
          if (!user.city) return false;
          
          const userCity = user.city.toLowerCase().trim();
          const userCityOnly = userCity.split(',')[0].trim();
          
          return userCityOnly === cityNameOnly || userCity === normalizedCityName;
        });
        
        console.log('[CityLocals] Filtered locals:', filtered.length);
        
        // Format and sort by trip count
        return filtered
          .map(user => ({
            id: user.id,
            email: user.email,
            name: user.preferred_name || user.full_name || user.email,
            photo: user.photo_url || user.picture,
            city: user.city,
            country: user.country,
            bio: user.bio,
            trips: user.metrics_my_trips || 0,
            followers: user.metrics_followers || 0
          }))
          .sort((a, b) => {
            // Sort by trips first
            if (b.trips !== a.trips) return b.trips - a.trips;
            // Then by followers
            return (b.followers || 0) - (a.followers || 0);
          });
      } catch (error) {
        console.error('[CityLocals] Error fetching locals:', error);
        return [];
      }
    },
    enabled: !!cityName,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (locals.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">
          No locals found yet
        </h3>
        <p className="text-gray-400">
          Be the first to set {cityName} as your home city and connect with future travelers!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Local Travelers in {cityName}
          </h2>
          <p className="text-gray-400">
            Connect with {locals.length} {locals.length === 1 ? 'traveler' : 'travelers'} who call this city home
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locals.map((local) => (
          <Link
            key={local.id}
            to={createProfileUrl(local.id)}
            className="bg-[#1A1B23] rounded-xl p-4 border border-[#2A2B35] hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                src={local.photo}
                name={local.name}
                userId={local.id}
                size="lg"
              />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                  {local.name}
                </h3>
                
                <p className="text-sm text-gray-400 truncate">
                  {local.city}
                </p>
                
                {local.bio && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {local.bio}
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{local.trips}</span>
                    <span className="text-gray-500">trips</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{local.followers}</span>
                    <span className="text-gray-500">followers</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}