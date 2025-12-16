import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function LoginModal({ isOpen, onClose }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // Small delay for smooth UX before redirect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Capture current location to return after OAuth
      const returnTo = window.location.pathname + window.location.search;
      
      // Call native Base44 OAuth method
      base44.auth.redirectToLogin(returnTo);
    } catch (err) {
      console.error("Login error:", err);
      setError(true);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        loading ? 'opacity-90' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      aria-describedby="login-modal-description"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/bc6c44404_photo-1517400508447-f8dd518b86db.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(2px)'
        }}
      />
      <div 
        className="absolute inset-0 bg-black/75 z-0" 
        onClick={!loading ? onClose : undefined}
        aria-label="Close modal"
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {!loading && (
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}

        <div className="bg-[#111827] backdrop-blur-md rounded-2xl p-8 border border-[#2A2B35] shadow-2xl">
          {!error ? (
            <>
              {/* Logo */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 p-4 shadow-lg shadow-blue-500/30">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e82e0380ac6e4a26051c6f/e98bb66bb_LogoWalvee.png" 
                    alt="Walvee" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 id="login-modal-title" className="text-2xl font-bold mb-2 text-white">
                  Welcome to Walvee
                </h1>
                <p className="text-blue-400 text-sm font-medium">
                  You're about to start your journey with AI-powered travel.
                </p>
              </div>

              {/* Main Message */}
              <div className="mb-8 text-center px-2">
                <p id="login-modal-description" className="text-gray-300 text-[15px] leading-relaxed">
                  After logging in, Walvee will guide you to plan, explore, and create unforgettable trips — <span className="text-blue-400 font-medium">powered by AI</span>, <span className="text-purple-400 font-medium">inspired by real travelers</span>.
                </p>
              </div>

              {/* Proceed to Login Button */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold text-base rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  'Proceed to login'
                )}
              </Button>

              {/* Terms Footer */}
              <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
                By signing in, you agree to our{" "}
                <button 
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827] rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button 
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111827] rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  Privacy Policy
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
                <p className="text-gray-400 text-sm">
                  We couldn't connect to the login service. Please try again.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-12 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    setError(false);
                    handleLogin();
                  }}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try again
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}