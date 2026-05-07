// AdminLayout.jsx - Responsive Layout Component
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AdminLayout.css";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when resizing from desktop to mobile
      if (mobile && collapsed) {
        setCollapsed(false);
      }
      // Reset mobile menu when resizing to desktop
      if (!mobile && mobileOpen) {
        setMobileOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [collapsed, mobileOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Close mobile menu when clicking a link (handled in Sidebar)
  const handleMobileClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <div
      className={`crm-layout 
        ${collapsed && !isMobile ? "collapsed" : ""} 
        ${mobileOpen ? "mobile-open" : ""}
      `}
    >
      {/* BACKDROP for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        collapsed={collapsed && !isMobile}
        onClose={handleMobileClose}
      />

      <div className="crm-main">
        <Topbar onToggle={toggleSidebar} />
        <div className="crm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}