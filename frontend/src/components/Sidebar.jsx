import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  TbScan,
  TbFlag,
  TbFileText,
  TbMap,
  TbPlus,
  TbX,
  TbScale,
} from 'react-icons/tb';

/**
 * Sidebar component:
 * - Fixed left sidebar (navy background #1B2A4A, ~180px wide)
 * - Logo / app name at top in Source Serif 4
 * - Official nav items: Scans, Flags, Reports, Map view
 * - Tabler icons for each nav item
 * - Active states with accent gold #C9A227
 * - Responsive down to tablet width
 */
const Sidebar = ({
  activeTab = 'scans',
  onTabChange,
  isOpen = false,
  onClose,
  flaggedCount = 0,
}) => {
  const navItems = [
    {
      id: 'scans',
      label: 'Scans',
      icon: TbScan,
      to: '/dashboard',
    },
    {
      id: 'flags',
      label: 'Flags',
      icon: TbFlag,
      badge: flaggedCount > 0 ? flaggedCount : null,
      to: '/dashboard?tab=flags',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TbFileText,
      to: '/dashboard?tab=reports',
    },
    {
      id: 'map',
      label: 'Map view',
      icon: TbMap,
      to: '/dashboard?tab=map',
    },
  ];

  const handleNavClick = (id) => {
    if (onTabChange) {
      onTabChange(id);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile / Tablet overlay backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[180px] bg-compliscan-navy text-white flex flex-col justify-between border-r border-[#121D33] transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Header / Logo */}
        <div>
          <div className="h-14 px-3.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-sm bg-compliscan-gold/20 border border-compliscan-gold/50 flex items-center justify-center text-compliscan-gold">
                <TbScale className="w-3.5 h-3.5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-sm tracking-tight leading-tight text-white">
                  CompliScan
                </h1>
                <p className="text-[9px] text-compliscan-gold tracking-wider uppercase font-sans font-medium">
                  Legal Metrology
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1 text-gray-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <TbX className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action: New Scan Button */}
          <div className="p-2.5">
            <NavLink
              to="/upload"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-sm bg-compliscan-gold text-compliscan-navy hover:bg-[#D8B137] text-xs font-semibold font-sans transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              <TbPlus className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </NavLink>
          </div>

          {/* Nav Items */}
          <nav className="mt-1 px-1.5 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-sans font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliscan-gold ${
                    isActive
                      ? 'text-compliscan-gold bg-white/10 border-l-2 border-compliscan-gold font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-compliscan-gold' : 'text-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-compliscan-flagged text-white font-mono font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Government Authority Badge */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          <div className="text-[10px] text-gray-400 font-sans leading-tight">
            <span className="block text-white font-medium">SIH 2026</span>
            <span className="block text-gray-400">PS26034</span>
            <span className="block text-[9px] text-compliscan-gold/80 mt-1 font-mono">
              Enforcement Mode
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
