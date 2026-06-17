'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, BarChart3, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebar, setSidebarOpen } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && sidebar.isOpen) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebar.isOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebar.isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-surface rounded-lg border border-white/10 md:hidden"
        >
          {sidebar.isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebar.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-surface border-r border-white/10 flex flex-col transition-transform duration-300 z-40',
          isMobile && 'fixed inset-y-0 left-0',
          isMobile && !sidebar.isOpen && '-translate-x-full'
        )}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary">Lumina</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary hover:scale-105'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-text-muted text-center">
            © 2026 Lumina
          </p>
        </div>
      </aside>
    </>
  );
}
