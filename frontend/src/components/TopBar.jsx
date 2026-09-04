import React, { useState } from 'react';
import { TbSearch, TbMenu2, TbShieldCheck, TbLogout } from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';

/**
 * TopBar component:
 * - Search input on left with clear focus states
 * - Official Ministry insignia / title
 * - Officer profile with avatar initials on right
 * - Thin border bottom, no heavy drop shadows
 */
const TopBar = ({
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  placeholder = 'Search by product name, GTIN, barcode, or manufacturer...',
}) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  // Compute officer initials
  const fullName = user?.full_name || user?.username || 'Compliance Officer';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'CO';

  const badgeNumber = user?.badge_number || 'IN-LM-702';
  const roleName = (user?.role || 'officer').toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-compliscan-card border-b border-compliscan-border h-14 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Search input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-sm text-compliscan-navy hover:bg-[#EFECE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliscan-gold"
            aria-label="Toggle navigation menu"
          >
            <TbMenu2 className="w-5 h-5" />
          </button>
        )}

        <div className="relative w-full">
          <label htmlFor="topbar-search" className="sr-only">
            Search scans, products, or manufacturers
          </label>
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-compliscan-secondary">
            <TbSearch className="w-4 h-4" />
          </div>
          <input
            id="topbar-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm font-sans bg-compliscan-bg border border-compliscan-border rounded-sm text-compliscan-navy placeholder-compliscan-secondary/70 focus:outline-none focus:ring-2 focus:ring-compliscan-gold focus:border-compliscan-gold transition-colors"
          />
        </div>
      </div>

      {/* Center/Right: Ministry Jurisdiction & Officer Profile */}
      <div className="flex items-center gap-4 pl-4">
        <div className="hidden lg:flex flex-col text-right pr-3 border-r border-compliscan-border/80">
          <span className="text-[11px] font-semibold text-compliscan-navy tracking-tight uppercase">
            Govt. of India
          </span>
          <span className="text-[10px] text-compliscan-secondary">
            Dept. of Consumer Affairs (Legal Metrology)
          </span>
        </div>

        {/* Officer Profile Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-sm hover:bg-[#EFECE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-compliscan-gold transition-colors"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar Initials */}
            <div className="w-8 h-8 rounded-sm bg-compliscan-navy text-compliscan-gold flex items-center justify-center text-xs font-semibold tracking-wider font-sans border border-compliscan-gold/40">
              {initials}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-compliscan-navy truncate max-w-[130px]">
                {fullName}
              </span>
              <span className="text-[10px] text-compliscan-secondary font-mono tracking-tight">
                {badgeNumber} • {roleName}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-56 bg-compliscan-card border border-compliscan-border rounded-sm shadow-none py-1 z-30">
              <div className="px-3 py-2 border-b border-compliscan-border bg-compliscan-bg/60">
                <p className="text-xs font-semibold text-compliscan-navy">
                  {fullName}
                </p>
                <p className="text-[11px] text-compliscan-secondary font-mono mt-0.5">
                  Badge: {badgeNumber}
                </p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-sm bg-compliscan-compliant-bg text-compliscan-compliant-text border border-compliscan-compliant-border font-medium">
                  Authorized Enforcement Officer
                </span>
              </div>

              <div className="py-1">
                <div className="px-3 py-1.5 text-[11px] text-compliscan-secondary flex items-center gap-1.5">
                  <TbShieldCheck className="w-3.5 h-3.5 text-compliscan-gold" />
                  <span>Rule 2011 Compliance Portal</span>
                </div>
              </div>

              <div className="border-t border-compliscan-border pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout && logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-compliscan-flagged hover:bg-compliscan-flagged-bg flex items-center gap-1.5 transition-colors"
                >
                  <TbLogout className="w-3.5 h-3.5" />
                  <span>Sign Out of Enforcement Station</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
