
import React from 'react';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartCount, onCartClick, onLogoClick }) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <h1 
          onClick={onLogoClick}
          className="text-xl font-light tracking-[0.5em] uppercase cursor-pointer hover:opacity-60 transition-all duration-500"
        >
          Euphoria
        </h1>
        
        <div className="flex items-center space-x-12">
          <nav className="hidden md:flex space-x-8 text-[10px] font-medium text-gray-400">
            <button onClick={onLogoClick} className="hover:text-black transition-colors tracking-[0.3em] uppercase">Collection</button>
          </nav>
          
          <button 
            onClick={onCartClick}
            className="relative p-2 group flex items-center gap-3"
            aria-label="Open bag"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400 group-hover:text-black transition-colors hidden sm:block">Bag</span>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
