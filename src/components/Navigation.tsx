import React from 'react';

interface NavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab = 'Dashboard', onTabChange }) => {
  const tabs = ['Dashboard', 'Alerts', 'Live Feeds', 'Configurations', 'Vision Agent'];

  return (
    <header 
      className="sticky top-0 z-50"
      style={{
        background: 'linear-gradient(to right, #6C69FC, #0890AE)',
      }}
    >
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo/Title */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(108, 105, 252, 0.2)' }}>
              <span className="text-white font-semibold text-lg">HCLTech</span>
            </div>
            <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(108, 105, 252, 0.2)' }}>
              <span className="text-white font-semibold text-lg">VisionX</span>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab
                    ? 'text-white bg-white bg-opacity-20'
                    : 'text-white text-opacity-80 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right: Settings/Help/Profile */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="p-2 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

