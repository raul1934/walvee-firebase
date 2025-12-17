import React from "react";
import { Link } from "react-router-dom";
import { createProfileUrl } from "@/utils";

const SIZES = {
  sm: { size: 32, imageSize: 64 },
  md: { size: 36, imageSize: 72 },
  lg: { size: 48, imageSize: 96 },
  xl: { size: 64, imageSize: 128 },
};

export default function UserAvatar({
  src,
  name = "User",
  size = "md",
  ring = false,
  className = "",
  userId = null,
  email = null,
}) {
  const [imageError, setImageError] = React.useState(false);
  const { size: dimension, imageSize } = SIZES[size] || SIZES.md;

  // Check if it's Walvee logo
  const isWalveeLogo = src?.includes("LogoWalvee.png");

  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Optimize Google photo URL with size parameter
  const getOptimizedUrl = (url) => {
    if (!url) return null;

    // If it's a Google photo URL, add size parameter
    if (url.includes("googleusercontent.com") || url.includes("ggpht.com")) {
      const hasParams = url.includes("?");
      return `${url}${hasParams ? "&" : "?"}sz=${imageSize}`;
    }

    return url;
  };

  const optimizedSrc = getOptimizedUrl(src);
  const initials = getInitials(name);

  const baseClasses = `
    rounded-full 
    shrink-0
    ${ring ? "ring-2 ring-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" : ""}
    ${className}
  `;

  const style = {
    width: `${dimension}px`,
    height: `${dimension}px`,
  };

  // Determine if avatar should be a link
  const shouldBeLink = userId !== undefined && userId !== null;

  // Use userId to create profile URL
  const profileUrl = shouldBeLink
    ? createProfileUrl(userId || undefined)
    : null;

  const avatarContent = () => {
    // Special rendering for Walvee logo
    if (isWalveeLogo && !imageError) {
      return (
        <div
          className={`${baseClasses} flex items-center justify-center bg-[#3B82F6] overflow-hidden`}
          style={style}
          role="img"
          aria-label={name}
        >
          <img
            src={optimizedSrc}
            alt={name}
            className="w-[65%] h-[65%] object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
            onError={() => setImageError(true)}
            role="img"
          />
        </div>
      );
    }

    // If no source or image failed to load, show initials fallback
    if (!optimizedSrc || imageError) {
      return (
        <div
          className={`${baseClasses} flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold select-none`}
          style={style}
          role="img"
          aria-label={name}
        >
          <span style={{ fontSize: `${dimension * 0.4}px` }}>{initials}</span>
        </div>
      );
    }

    // Regular avatar image
    return (
      <img
        src={optimizedSrc}
        alt={name}
        className={`${baseClasses} object-cover object-center`}
        style={style}
        onError={() => setImageError(true)}
        role="img"
      />
    );
  };

  // Wrap with Link if email or userId is provided
  if (shouldBeLink && profileUrl) {
    return (
      <Link
        to={profileUrl}
        className="inline-block hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {avatarContent()}
      </Link>
    );
  }

  return avatarContent();
}
