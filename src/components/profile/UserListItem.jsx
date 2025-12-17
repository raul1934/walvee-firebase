import React from "react";
import { Link } from "react-router-dom";
import { createProfileUrl } from "@/utils";
import { MapPin } from "lucide-react";
import UserAvatar from "../common/UserAvatar";

export default function UserListItem({ user, currentUser, onFollowToggle }) {
  const isOwnProfile = currentUser?.id === user.id;
  
  return (
    <Link
      to={createProfileUrl(user.id)}
      className="bg-[#1A1B23] rounded-xl p-4 border border-[#2A2B35] hover:border-blue-500/30 transition-all block"
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          src={user.photo_url || user.picture}
          name={user.preferred_name || user.full_name}
          size="lg"
          ring
        />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate mb-1 hover:text-blue-400 transition-colors">
            {user.preferred_name || user.full_name || 'Traveler'}
          </h4>
          
          {user.bio && (
            <p className="text-sm text-gray-400 line-clamp-2 mb-2">
              {user.bio}
            </p>
          )}
          
          {(user.city || user.country) && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {user.city && user.country ? (
                  `${user.city}, ${user.country.split('-')[0]?.trim() || user.country}`
                ) : user.city || user.country}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="text-gray-400">
              <span className="font-semibold text-white">{user.metrics_my_trips || 0}</span> trips
            </span>
            <span className="text-gray-400">
              <span className="font-semibold text-white">{user.metrics_followers || 0}</span> followers
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}