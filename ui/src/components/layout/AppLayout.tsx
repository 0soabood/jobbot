import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  LayoutDashboard, 
  Search, 
  FileText, 
  Settings, 
  Menu, 
  X,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Job Search', icon: Search, path: '/jobs' },
    { name: 'Applications', icon: FileText, path: '/applications' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r-0 rounded-none transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-signal-green rounded flex items-center justify-center glow-green">
              <Zap className="w-5 h-5 text-graphite-950 fill-current" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tighter">
              jobbot<span className="text-signal-green">.</span>
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-signal-green/10 text-signal-green border border-signal-green/20" 
                    : "text-steel hover:text-mercury hover:bg-graphite-800"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-graphite-800">
            <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 rounded-full bg-graphite-700 border border-graphite-600 flex items-center justify-center">
                <User className="w-5 h-5 text-steel" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Alex Rivera</p>
                <p className="text-xs text-steel truncate">Pro Member</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-4 text-steel hover:text-red-500">
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Hide layout on landing and onboarding
  const isPublicPage = location.pathname === '/' || location.pathname === '/onboarding';

  if (isPublicPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-graphite-950 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-graphite-800 bg-graphite-950/50 backdrop-blur-md sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 text-steel hover:text-mercury"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-graphite-800 rounded-full border border-graphite-700">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-steel">SYSTEM ACTIVE</span>
            </div>
            <Button size="sm" className="hidden sm:flex">
              New Application
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-10 scrollbar-thin">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
