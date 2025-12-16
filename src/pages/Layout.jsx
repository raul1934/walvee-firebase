
import React, { useState, useEffect } from "react";
import { firebaseAuthService } from "@/api/firebaseAuth";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import LoginModal from "@/components/common/LoginModal";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuthenticated = await firebaseAuthService.isAuthenticated();

        if (!isAuthenticated) {
          setUser(null);
          setLoading(false);
          return;
        }

        const currentUser = await firebaseAuthService.me();
        console.log('[Layout] User loaded successfully:', currentUser.id);
        setUser(currentUser);

        if (currentUser.picture && !currentUser.photo_url) {
          try {
            await firebaseAuthService.updateMe({
              photo_url: currentUser.picture,
              photo_updated_at: new Date().toISOString()
            });
          } catch (error) {
            console.error("Error updating photo:", error);
          }
        }

        if (currentUser && !currentUser.onboarding_completed && currentPageName !== "Onboarding") {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (error) {
        console.error('[Layout] Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [currentPageName, navigate]);

  const openLoginModal = React.useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  // Clone children with props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        user, 
        userLoading: loading,
        openLoginModal 
      });
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white">
      <Navbar 
        user={user} 
        onMenuClick={() => setIsSidebarOpen(true)}
        openLoginModal={openLoginModal}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        openLoginModal={openLoginModal}
      />

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <main>
        {childrenWithProps}
      </main>
    </div>
  );
}
