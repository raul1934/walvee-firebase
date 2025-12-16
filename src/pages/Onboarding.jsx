
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, User as UserIcon, Shield, Search, Lock, X } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBYLf9H7ZYfGU5fZa2Fr6XfA9ZkBmJHTb4";

export default function Onboarding({ user: userProp, userLoading }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const autocompleteService = useRef(null);
  
  const [formData, setFormData] = useState({
    preferred_name: "",
    city: "",
    country: "",
    age_in_years: "",
    gender: "",
    gender_other: "",
    terms_accepted: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Use user from props if available, otherwise fetch
        if (userProp) {
          // If userProp is provided, prioritize it.
          // Only update local state if it's different to prevent unnecessary renders/effects.
          if (user !== userProp) {
            setUser(userProp);
          }
        } else if (!userLoading) {
          // If userProp is null/undefined and parent is not loading,
          // then check if user is authenticated and fetch if necessary.
          const isAuthenticated = await base44.auth.isAuthenticated();
          if (!isAuthenticated) {
            navigate(createPageUrl("Home"));
            return;
          }
          const currentUser = await base44.auth.me();
          // Only update local state if it's different.
          if (user !== currentUser) {
            setUser(currentUser);
          }
        }
        
        // This part uses the most current 'user' available, either from props or the local state.
        // This will correctly reflect userProp or a fetched user from *this or a previous* render cycle
        // due to `user` being in the dependency array, triggering re-runs with updated state.
        const userToProcess = userProp || user;

        if (userToProcess) { // Ensure we have a user object to process
          setFormData(prev => ({
            ...prev,
            preferred_name: userToProcess.preferred_name || userToProcess.full_name?.split(' ')[0] || "",
            city: userToProcess.city || "",
            country: userToProcess.country || "",
            age_in_years: userToProcess.age_in_years || "",
            gender: userToProcess.gender || "",
            gender_other: userToProcess.gender_other || ""
          }));

          if (userToProcess.city && userToProcess.country) {
            setLocationQuery(`${userToProcess.city}, ${userToProcess.country}`);
            setSelectedLocation({ city: userToProcess.city, country: userToProcess.country });
          }

          if (userToProcess.onboarding_completed) {
            navigate(createPageUrl("Home"));
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    // Ensure this effect runs when userProp or userLoading changes, or if the local 'user' state updates (e.g., after a fetch).
    loadUser();
  }, [userProp, userLoading, navigate, user]);

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
    if (window.google && window.google.maps && window.google.maps.places && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
    }
  }, [locationQuery]);

  const handleLocationSearch = (query) => {
    setLocationQuery(query);
    setSelectedLocation(null);
    
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
    let city = "";
    let country = "";
    const terms = prediction.terms;

    if (terms.length > 0) {
      city = terms[0].value;
    }
    if (terms.length > 1) {
      country = terms[terms.length - 1].value;
    } else if (terms.length === 1 && prediction.description.includes(',')) {
      const parts = prediction.description.split(',').map(s => s.trim());
      city = parts[0];
      if (parts.length > 1) {
        country = parts[parts.length - 1];
      }
    }
    
    setSelectedLocation({ city, country });
    setLocationQuery(prediction.description);
    setLocationSuggestions([]);
    
    setFormData(prev => ({
      ...prev,
      city,
      country
    }));
  };

  const handleSubmit = async () => {
    if (!formData.terms_accepted) {
      alert("You need to accept the terms to continue");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        preferred_name: formData.preferred_name,
        onboarding_completed: true,
        terms_accepted_at: new Date().toISOString(),
        consent_given_at: new Date().toISOString(),
        locale: navigator.language || "en-US",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      if (formData.city) updateData.city = formData.city;
      if (formData.country) updateData.country = formData.country;

      let demographicConsentGiven = false;
      if (formData.age_in_years) {
        updateData.age_in_years = parseInt(formData.age_in_years);
        demographicConsentGiven = true;
      }
      if (formData.gender) {
        updateData.gender = formData.gender;
        demographicConsentGiven = true;
      }
      if (formData.gender === "self-describe" && formData.gender_other) {
        updateData.gender_other = formData.gender_other;
        demographicConsentGiven = true;
      } else if (formData.gender !== "self-describe") {
        updateData.gender_other = null;
      }

      updateData.consent_demographics = demographicConsentGiven;
      updateData.consent_location = !!(formData.city || formData.country);

      await base44.auth.updateMe(updateData);
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error saving profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 -mt-16 pt-16">
      {/* Background Image - Step 1 */}
      {step === 1 && (
        <>
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/9cc390dd3_570312_DSC_4674.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-black/60 z-0" />
        </>
      )}

      {/* Background Image - Step 2 */}
      {step === 2 && (
        <>
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/603ed0518_photo-1589801321916-f30314ae2442.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-black/60 z-0" />
        </>
      )}

      {/* Background Image - Step 3 */}
      {step === 3 && (
        <>
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/ba8b363ed_photo-1660076327655-a43e7cadf86d.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="absolute inset-0 bg-black/60 z-0" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl text-white">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 p-6 shadow-lg shadow-blue-500/30">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/e98bb66bb_LogoWalvee.png" 
              alt="Walvee" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Walvee!</h1>
          <p className="text-gray-300">Let's personalize your experience in just a few steps</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? "w-12 bg-blue-600" : "w-8 bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-[#1A1B23]/95 backdrop-blur-md rounded-2xl p-8 border border-[#2A2B35] shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <UserIcon className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">What would you like to be called?</h2>
              </div>
              
              <div>
                <Label htmlFor="preferred_name" className="text-gray-300 mb-2 block">
                  Display name
                </Label>
                <Input
                  id="preferred_name"
                  value={formData.preferred_name}
                  onChange={(e) => setFormData({...formData, preferred_name: e.target.value})}
                  placeholder="e.g. Maria"
                  className="bg-[#0D0D0D] border-gray-700 text-white h-12"
                />
                <p className="text-sm text-gray-400 mt-2">
                  This will be the name shown to other travelers
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                disabled={!formData.preferred_name}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Let's personalize your experience</h2>
                <p className="text-gray-300 text-sm">
                  Tell us a bit about yourself so we can craft better trips and suggestions for you
                </p>
              </div>

              {/* Location Block */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Where do you live?</h3>
                </div>

                <div className="relative">
                  <Label className="text-gray-300 mb-2 block">
                    City & Country <span className="text-gray-500 text-sm">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input
                      value={locationQuery}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      placeholder="Type your city..."
                      className="bg-[#1F1F1F] border-[#2E2E2E] text-white pl-10 h-12"
                    />
                  </div>

                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#1F1F1F] border border-[#2E2E2E] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {locationSuggestions.map((prediction) => (
                        <button
                          key={prediction.place_id}
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

                <p className="text-xs text-gray-500 mt-2">
                  We'll suggest great deals, local routes, and travelers nearby based on your location
                </p>
              </div>

              {/* About You Block */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">About you</h3>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-3">
                  {/* Age Field */}
                  <div>
                    <Label htmlFor="age" className="text-gray-300 mb-2 block">
                      Age <span className="text-gray-500 text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="age"
                      type="text"
                      inputMode="numeric"
                      value={formData.age_in_years}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d+$/.test(value)) {
                          const numValue = parseInt(value);
                          if (value === "" || (numValue >= 0 && numValue <= 120)) {
                            setFormData({...formData, age_in_years: value});
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value && parseInt(value) < 13) {
                          setFormData({...formData, age_in_years: ""});
                        }
                      }}
                      placeholder="Age"
                      className="bg-[#1F1F1F] border-[#2E2E2E] text-white h-12"
                    />
                  </div>

                  {/* Gender Field */}
                  <div>
                    <Label htmlFor="gender" className="text-gray-300 mb-2 block">
                      Gender <span className="text-gray-500 text-xs font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({...formData, gender: value, gender_other: value !== "self-describe" ? "" : formData.gender_other})}
                    >
                      <SelectTrigger className="bg-[#1F1F1F] border-[#2E2E2E] text-white h-12">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="transgender">Transgender</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        <SelectItem value="self-describe">Self-describe...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Used only for personalized travel insights
                </p>

                {/* Self-describe field */}
                {formData.gender === "self-describe" && (
                  <div className="mt-3">
                    <Input
                      value={formData.gender_other}
                      onChange={(e) => setFormData({...formData, gender_other: e.target.value})}
                      placeholder="Describe here"
                      maxLength={40}
                      className="bg-[#1F1F1F] border-[#2E2E2E] text-white h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formData.gender_other.length}/40 characters
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="h-12 border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">Privacy and Terms</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-950/30 border-2 border-blue-500/50 rounded-lg">
                  <Checkbox
                    id="terms_accepted"
                    checked={formData.terms_accepted}
                    onCheckedChange={(checked) => setFormData({...formData, terms_accepted: checked})}
                    className="mt-0.5 border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label htmlFor="terms_accepted" className="text-sm cursor-pointer leading-relaxed">
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveModal('terms');
                      }}
                      className="text-blue-400 underline hover:text-blue-300 transition-colors"
                    >
                      Terms of Use
                    </button>
                    {" "}and the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveModal('privacy');
                      }}
                      className="text-blue-400 underline hover:text-blue-300 transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>

              <div className="bg-[#111827] rounded-lg p-5 mt-4">
                <div className="flex items-start gap-3 mb-3">
                  <Lock className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-white font-semibold">
                    Your data is secure
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-400 ml-8">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>You can change or delete your data at any time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>We never share your data without your consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">•</span>
                    <span>Fully compliant with LGPD and Google policies</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="h-12 border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                  disabled={!formData.terms_accepted || loading}
                >
                  {loading ? "Saving..." : "Start my journey"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms of Use Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setActiveModal(null)} />
          <div className="relative bg-[#0D0D0D] rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-[#2A2B35]">
            <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#2A2B35] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Terms of Use</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)] text-gray-300 space-y-4">
              <p className="text-sm text-gray-400">Last updated: January 10, 2025</p>
              
              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">1. Acceptance of Terms</h3>
                <p>By accessing and using Walvee ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Use, please do not use the Service.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">2. Description of Service</h3>
                <p>Walvee provides a platform for travelers to create, share, and discover personalized travel itineraries. Our AI-powered tools help users plan and organize their trips with recommendations from real travelers.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">3. User Accounts</h3>
                <p>To use certain features of the Service, you must register for an account. You agree to:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">4. User Content</h3>
                <p>You retain ownership of content you post on Walvee. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform.</p>
                <p className="mt-2">You agree not to post content that:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Violates any laws or regulations</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains harmful or offensive material</li>
                  <li>Promotes illegal activities</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">5. Privacy</h3>
                <p>Your use of the Service is also governed by our <button type="button" onClick={() => setActiveModal('privacy')} className="text-blue-400 underline hover:text-blue-300">Privacy Policy</button>. Please review our Privacy Policy to understand our practices.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">6. Termination</h3>
                <p>We reserve the right to terminate or suspend your account at any time, with or without notice, for conduct that we believe violates these Terms of Use or is harmful to other users, us, or third parties.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">7. Limitation of Liability</h3>
                <p>Walvee is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">8. Contact</h3>
                <p>If you have any questions about these Terms, please contact us at: <a href="mailto:legal@walvee.com" className="text-blue-400 underline hover:text-blue-300">legal@walvee.com</a></p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setActiveModal(null)} />
          <div className="relative bg-[#0D0D0D] rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-[#2A2B35]">
            <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#2A2B35] p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)] text-gray-300 space-y-4">
              <p className="text-sm text-gray-400">Last updated: January 10, 2025</p>
              
              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">1. Information We Collect</h3>
                <p className="mb-2">We collect information you provide directly to us, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong className="text-white">Account Information:</strong> Name, email, profile photo (from Google OAuth)</li>
                  <li><strong className="text-white">Optional Demographics:</strong> Age, gender (only if you provide them)</li>
                  <li><strong className="text-white">Location:</strong> City and country (only if you provide them)</li>
                  <li><strong className="text-white">User Content:</strong> Trip itineraries, photos, comments you post</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">2. How We Use Your Information</h3>
                <p className="mb-2">We use the information we collect to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Provide and improve our services</li>
                  <li>Personalize travel recommendations</li>
                  <li>Communicate with you about updates and features</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">3. Data Sharing</h3>
                <p><strong className="text-white">We never sell your personal data.</strong> We may share your information only in these cases:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong className="text-white">Public Content:</strong> Trip itineraries you choose to make public</li>
                  <li><strong className="text-white">Service Providers:</strong> Trusted partners who help us operate (e.g., Google Cloud, authentication)</li>
                  <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">4. Your Rights (LGPD Compliance)</h3>
                <p className="mb-2">Under Brazil's LGPD, you have the right to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong className="text-white">Access:</strong> Request a copy of your data</li>
                  <li><strong className="text-white">Correction:</strong> Update inaccurate information</li>
                  <li><strong className="text-white">Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong className="text-white">Portability:</strong> Export your data in JSON format</li>
                  <li><strong className="text-white">Revoke Consent:</strong> Withdraw consent for data processing</li>
                </ul>
                <p className="mt-2">To exercise these rights, visit your <strong className="text-white">Privacy Settings</strong> or contact us at <a href="mailto:privacy@walvee.com" className="text-blue-400 underline hover:text-blue-300">privacy@walvee.com</a></p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">5. Data Security</h3>
                <p>We implement industry-standard security measures to protect your data, including:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Encryption in transit (HTTPS/TLS)</li>
                  <li>Encryption at rest for sensitive data</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">6. Google OAuth Integration</h3>
                <p>We use Google OAuth for authentication. When you sign in with Google:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>We only access your basic profile (name, email, photo)</li>
                  <li>We comply with Google's API Services User Data Policy</li>
                  <li>We do not access your Google Drive, Gmail, or other services</li>
                  <li>You can revoke access anytime via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Google Account Settings</a></li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">7. Cookies and Tracking</h3>
                <p>We use essential cookies for authentication and session management. We do not use third-party advertising or analytics cookies without your consent.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">8. Children's Privacy</h3>
                <p>Walvee is not intended for users under 13 years old. We do not knowingly collect data from children. If you believe we have collected data from a child, please contact us immediately.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">9. Changes to This Policy</h3>
                <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-blue-400 mb-3">10. Contact Us</h3>
                <p>For privacy-related questions or to exercise your rights:</p>
                <ul className="list-none ml-4 mt-2 space-y-1">
                  <li><strong className="text-white">Email:</strong> <a href="mailto:privacy@walvee.com" className="text-blue-400 underline hover:text-blue-300">privacy@walvee.com</a></li>
                  <li><strong className="text-white">Data Protection Officer:</strong> <a href="mailto:dpo@walvee.com" className="text-blue-400 underline hover:text-blue-300">dpo@walvee.com</a></li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
