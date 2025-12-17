import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import LoginModal from "@/components/common/LoginModal";

export default function Layout({ children }) {
  const { user, openLoginModal, closeLoginModal, isLoginModalOpen } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />

      <main>{children}</main>
    </div>
  );
}
