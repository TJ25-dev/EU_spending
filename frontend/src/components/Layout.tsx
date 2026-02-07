import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, FileText, Info, Trophy } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/top-contracts', label: 'Top Contracts', icon: Trophy },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/about', label: 'About', icon: Info },
];

const Layout: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-eu-blue text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <NavLink to="/" className="flex items-center space-x-3 flex-shrink-0">
              <img
                src="/logo.svg"
                alt="EU Procurement Tracker"
                className="w-10 h-10 drop-shadow-lg"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight">
                  EU Procurement Tracker
                </h1>
                <p className="text-xs text-blue-200 leading-tight">
                  Making public spending transparent
                </p>
              </div>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="text-center sm:text-left">
              <p>
                Data sourced from{' '}
                <a
                  href="https://ted.europa.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  TED (Tenders Electronic Daily)
                </a>
              </p>
              <p className="mt-1">European Union Open Data Portal</p>
            </div>
            <p className="text-gray-500">
              &copy; {currentYear} EU Procurement Tracker
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
