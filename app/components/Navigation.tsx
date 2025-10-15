"use client";

import { useState } from "react";

export type AppRoute = "upload" | "generate" | "recordings" | "pricing";

interface NavigationProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  onLogout?: () => void;
}

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    {isOpen ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    )}
  </svg>
);

const HamburgerButton = ({ isOpen, onToggle }: HamburgerMenuProps) => (
  <button
    onClick={onToggle}
    className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    aria-label={isOpen ? "Close menu" : "Open menu"}
    aria-expanded={isOpen}
  >
    <HamburgerIcon isOpen={isOpen} />
  </button>
);

const MobileMenu = ({ 
  isOpen, 
  currentRoute, 
  onRouteChange, 
  onClose,
  onLogout
}: {
  isOpen: boolean;
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  onClose: () => void;
  onLogout?: () => void;
}) => {
  const menuItems = [
    {
      id: "upload" as AppRoute,
      label: "Upload Voice",
      icon: "📤",
      description: "Create voice clones"
    },
    {
      id: "generate" as AppRoute,
      label: "Generate Speech",
      icon: "🎤",
      description: "Select voice & create TTS"
    },
    {
      id: "recordings" as AppRoute,
      label: "Voice Recordings",
      icon: "🎵",
      description: "Browse saved recordings"
    },
    {
      id: "pricing" as AppRoute,
      label: "Pricing",
      icon: "💳",
      description: "View subscription plans"
    }
  ];

  const handleRouteSelect = (route: AppRoute) => {
    onRouteChange(route);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Voice App
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Close menu"
            >
              <HamburgerIcon isOpen={true} />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleRouteSelect(item.id)}
                className={`w-full flex items-start p-4 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  currentRoute === item.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-2xl mr-3 flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </div>
                </div>
                {currentRoute === item.id && (
                  <div className="ml-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          {onLogout && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center p-4 rounded-lg text-left transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <span className="text-2xl mr-3 flex-shrink-0" aria-hidden="true">
                  🚪
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">Logout</div>
                  <div className="text-sm text-red-500 dark:text-red-400 mt-1">
                    Sign out of your account
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const DesktopNavigation = ({ 
  currentRoute, 
  onRouteChange 
}: {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
}) => {
  const menuItems = [
    {
      id: "upload" as AppRoute,
      label: "Upload Voice",
      icon: "📤"
    },
    {
      id: "generate" as AppRoute,
      label: "Generate Speech",
      icon: "🎤"
    },
    {
      id: "recordings" as AppRoute,
      label: "Voice Recordings",
      icon: "🎵"
    },
    {
      id: "pricing" as AppRoute,
      label: "Pricing",
      icon: "💳"
    }
  ];

  return (
    <nav className="hidden md:flex md:space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onRouteChange(item.id)}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            currentRoute === item.id
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <span className="mr-2" aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export const Navigation = ({ currentRoute, onRouteChange, onLogout }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <HamburgerButton 
          isOpen={isMobileMenuOpen} 
          onToggle={handleMobileMenuToggle} 
        />
        <DesktopNavigation 
          currentRoute={currentRoute} 
          onRouteChange={onRouteChange} 
        />
      </div>
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        onClose={handleMobileMenuClose}
        onLogout={onLogout}
      />
    </>
  );
};
