import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { uploadImage } from "@/api/firebaseStorage";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Search, ArrowLeft } from "lucide-react";
import UserAvatar from "../components/common/UserAvatar";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";
const MAX_BIO_LENGTH = 200;

export default function EditProfile({ user, userLoading }) {
  const autocompleteService = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: "",
    preferred_name: "",
    bio: "",
    city: "",
    country: "",
    photo_url: ""
  });

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = createPageUrl("Home");
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        preferred_name: user.preferred_name || "",
        bio: user.bio || "",
        city: user.city || "",
        country: user.country || "",
        photo_url: user.photo_url || user.picture || ""
      });
      
      if (user.city && user.country) {
        setLocationQuery(`${user.city}, ${user.country}`);
      }
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
        city: formData.city.trim(),
        country: formData.country.trim()
      };

      if (formData.photo_url) {
        updateData.photo_url = formData.photo_url;
        updateData.photo_updated_at = new Date().toISOString();
      }

      await User.updateMe(updateData);
      window.location.href = createPageUrl("Profile");
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F] pt-16">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = createPageUrl("Profile")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35]">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Photo</h2>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <UserAvatar
                  src={formData.photo_url}
                  name={formData.preferred_name || formData.full_name}
                  size="xl"
                  ring={true}
                  className="ring-4 ring-blue-500/30"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors border-2 border-[#1A1B23]"
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
                <p className="text-sm text-gray-400 mb-2">
                  Upload a new profile photo
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35] space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
            
            <div>
              <Label htmlFor="full_name" className="text-gray-300 mb-2 block">
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="John Doe"
                className="bg-[#0D0D0D] border-gray-700 text-white h-12"
              />
            </div>

            <div>
              <Label htmlFor="preferred_name" className="text-gray-300 mb-2 block">
                Preferred Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="preferred_name"
                value={formData.preferred_name}
                onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                placeholder="How would you like to be called?"
                className="bg-[#0D0D0D] border-gray-700 text-white h-12"
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">
                This is the name shown to other travelers
              </p>
            </div>
          </div>

          <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35]">
            <h2 className="text-lg font-semibold text-white mb-4">About You</h2>
            
            <div>
              <Label htmlFor="bio" className="text-gray-300 mb-2 block">
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
                className="bg-[#0D0D0D] border-gray-700 text-white min-h-[120px] resize-none"
                maxLength={MAX_BIO_LENGTH}
              />
              <p className="text-xs text-gray-500 mt-1.5 text-right">
                {formData.bio.length}/{MAX_BIO_LENGTH} characters
              </p>
            </div>
          </div>

          <div className="bg-[#1A1B23] rounded-2xl p-6 border border-[#2A2B35]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Your Location
            </h2>
            
            <div className="relative">
              <Label className="text-gray-300 mb-2 block">
                City & Country
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <Input
                  value={locationQuery}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  placeholder="Search for your city..."
                  className="bg-[#0D0D0D] border-gray-700 text-white pl-10 h-12"
                />
              </div>

              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-[#1F1F1F] border border-[#2E2E2E] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {locationSuggestions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      onClick={() => handleLocationSelect(prediction)}
                      className="w-full text-left px-4 py-3 hover:bg-[#2A2B35] transition-colors border-b border-[#2E2E2E] last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-white text-sm">{prediction.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => window.location.href = createPageUrl("Profile")}
              variant="outline"
              className="flex-1 h-12 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}