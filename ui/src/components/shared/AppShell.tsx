import * as React from 'react';
import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const isPublicPage = location.pathname === '/' || location.pathname === '/onboarding';

  if (isPublicPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { title: 'Jobs Search', icon: Search, path: '/jobs' },
    { title: 'Applications', icon: FileText, path: '/applications' },
    { title: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-graphite-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,65,0.08),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,77,0,0.07),transparent_24%)]" />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-graphite-800/80 bg-graphite-900/92 backdrop-blur-xl transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-signal-green rounded flex items-center justify-center glow-green group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-graphite-950 fill-current" />
            </div>
            {isSidebarOpen && (
              <span className="font-display font-bold text-xl tracking-tighter text-mercury">
                jobbot<span className="text-signal-green">.</span>
              </span>
            )}
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-steel hover:text-mercury transition-colors hidden lg:block"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-signal-green/10 text-signal-green border border-signal-green/20 shadow-[0_0_0_1px_rgba(0,255,65,0.05)]" 
                  : "text-steel hover:text-mercury hover:bg-graphite-800"
              )}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">{item.title}</span>}
              {isSidebarOpen && <ChevronRight className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-graphite-800">
          <Button variant="ghost" className={cn("w-full justify-start gap-3", !isSidebarOpen && "px-2")}>
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <header className="h-16 border-b border-graphite-800/70 flex items-center justify-between px-8 bg-graphite-950/60 backdrop-blur-xl sticky top-0 z-40">
          <h2 className="font-display text-lg tracking-tight uppercase">
            {navItems.find(i => location.pathname.startsWith(i.path))?.title || 'JobBot'}
          </h2>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-graphite-800 rounded-full border border-graphite-700">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulse" />
              <span className="text-[10px] font-mono font-semibold tracking-[0.18em] text-steel">AI READY</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-graphite-700 border border-graphite-600 flex items-center justify-center text-xs font-bold text-mercury">
              JB
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
