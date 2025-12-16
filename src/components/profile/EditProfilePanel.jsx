
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { uploadImage } from "@/api/firebaseStorage";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Search, X } from "lucide-react";
import UserAvatar from "../common/UserAvatar";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";
const MAX_BIO_LENGTH = 200;

export default function EditProfilePanel({ user, onClose, onSave }) {
  const queryClient = useQueryClient();
  const autocompleteService = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    preferred_name: user?.preferred_name || "",
    bio: user?.bio || "",
    instagram_username: user?.instagram_username || "",
    city: user?.city || "",
    country: user?.country || "",
    photo_url: user?.photo_url || user?.picture || ""
  });

  useEffect(() => {
    if (user?.city && user?.country) {
      setLocationQuery(`${user.city}, ${user.country}`);
    }
  }, [user]);

  useEffect(() => {
    if (window.google) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (window.google?.maps?.places && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, []);

  const handleLocationSearch = (query) => {
    setLocationQuery(query);
    
    if (!query || !autocompleteService.current) {
      setLocationSuggestions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        types: ['(cities)']
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setLocationSuggestions(predictions);
        } else {
          setLocationSuggestions([]);
        }
      }
    );
  };

  const handleLocationSelect = (prediction) => {
    const terms = prediction.terms;
    const city = terms.length > 0 ? terms[0].value : "";
    const country = terms.length > 1 ? terms[terms.length - 1].value : "";
    
    setFormData(prev => ({ ...prev, city, country }));
    setLocationQuery(prediction.description);
    setLocationSuggestions([]);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const { file_url } = await uploadImage(file);
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInstagramChange = (e) => {
    let value = e.target.value;
    // Remove @ if user types it
    if (value.startsWith('@')) {
      value = value.substring(1);
    }
    // Only allow valid Instagram username characters (alphanumeric, periods, underscores)
    value = value.replace(/[^a-zA-Z0-9._]/g, '');
    setFormData({...formData, instagram_username: value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.preferred_name.trim()) {
      alert('Please enter your preferred name');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        full_name: formData.full_name.trim(),
        preferred_name: formData.preferred_name.trim(),
        bio: formData.bio.trim(),
        instagram_username: formData.instagram_username.trim(),
        city: formData.city.trim(),
        country: formData.country.trim()
      };

      if (formData.photo_url) {
        updateData.photo_url = formData.photo_url;
        updateData.photo_updated_at = new Date().toISOString();
      }

      // Update the user
      await User.updateMe(updateData);
      
      // Force immediate refetch of all user-related queries
      await queryClient.refetchQueries(['profileUser', user?.id]);
      await queryClient.refetchQueries(['currentUser']);
      await queryClient.refetchQueries(['userKPIs', user?.id]);
      
      // Also invalidate to ensure future fetches get fresh data
      queryClient.invalidateQueries(['profileUser']);
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['userKPIs']);
      
      // Call onSave AFTER all data is refreshed
      onSave();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* Walvee Scrollbar Standard */
        .walvee-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .walvee-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .walvee-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3B82F6 0%, #8B5CF6 100%);
          border-radius: 8px;
        }
        
        .walvee-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #60A5FA 0%, #A78BFA 100%);
          box-shadow: 0 0 8px rgba(59,130,246,0.5);
        }
        
        .walvee-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3B82F6 transparent;
        }

        .location-suggestions-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .location-suggestions-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .location-suggestions-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3B82F6 0%, #8B5CF6 100%);
          border-radius: 8px;
        }
        
        .location-suggestions-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #60A5FA 0%, #A78BFA 100%);
          box-shadow: 0 0 8px rgba(59,130,246,0.5);
        }
        
        .location-suggestions-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3B82F6 transparent;
        }

        @media (max-width: 768px) {
          .walvee-scroll::-webkit-scrollbar,
          .location-suggestions-scroll::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>

      <div className="h-full flex flex-col bg-[#0A0B0F]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#2A2B35] bg-[#0A0B0F]">
          <h2 className="text-lg font-bold text-white">Edit Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#1A1B23] h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto walvee-scroll">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar
                    src={formData.photo_url}
                    name={formData.preferred_name || formData.full_name}
                    size="xl"
                    ring={true}
                    className="ring-2 ring-blue-500/30"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors border-2 border-[#0A0B0F] shadow-lg"
                  >
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-300 font-medium">Upload a new profile photo</p>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="text-gray-300 mb-2 block text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="John Doe"
                      className="bg-[#1A1B23] border-[#2A2B35] text-white h-11 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferred_name" className="text-gray-300 mb-2 block text-sm">
                      Preferred Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="preferred_name"
                      value={formData.preferred_name}
                      onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                      placeholder="John"
                      className="bg-[#1A1B23] border-[#2A2B35] text-white h-11 text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* About You */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">About You</h3>
                
                <div>
                  <Label htmlFor="bio" className="text-gray-300 mb-2 block text-sm">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_BIO_LENGTH) {
                        setFormData({...formData, bio: e.target.value});
                      }
                    }}
                    placeholder="Tell other travelers about yourself..."
                    className="bg-[#1A1B23] border-[#2A2B35] text-white h-28 resize-none text-sm"
                    maxLength={MAX_BIO_LENGTH}
                  />
                  <p className="text-xs text-gray-500 mt-1.5 text-right">
                    {formData.bio.length}/{MAX_BIO_LENGTH} characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="instagram" className="text-gray-300 mb-2 block text-sm">
                    Instagram
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <Input
                      id="instagram"
                      value={formData.instagram_username}
                      onChange={handleInstagramChange}
                      placeholder="username"
                      className="bg-[#1A1B23] border-[#2A2B35] text-white h-11 text-sm pl-8"
                      maxLength={30}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Your Instagram username (without @)
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  Your Location
                </h3>
                
                <div className="relative">
                  <Label className="text-gray-300 mb-2 block text-sm">
                    City & Country
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      value={locationQuery}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      placeholder="Search for your city..."
                      className="bg-[#1A1B23] border-[#2A2B35] text-white pl-10 h-11 text-sm"
                    />
                  </div>

                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#1A1B23] border border-[#2A2B35] rounded-xl shadow-2xl max-h-60 overflow-y-auto location-suggestions-scroll">
                      {locationSuggestions.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          type="button"
                          onClick={() => handleLocationSelect(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-[#2A2B35] transition-colors border-b border-[#2A2B35] last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-white text-sm">{prediction.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-[#2A2B35]">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-11 border-[#2A2B35] text-gray-300 hover:bg-[#1A1B23] hover:text-white text-sm font-medium rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingPhoto}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
