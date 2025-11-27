import React from 'react';
import { Map } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-indigo-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo and App Name now act as the main navigation link to home */}
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition-opacity">
              <Map className="w-6 h-6" />
              <span>PetaPintar - AGENT03 RANTAU</span>
            </Link>
          </div>
          {/* Admin and Public links are removed for a cleaner, context-separated UI */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
