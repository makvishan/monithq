'use client';

import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export default function MainContent({ children, className }) {
  const { isCollapsed } = useSidebar();

  return (
    <main 
      className={cn(
        'flex-1 p-8 transition-all duration-300',
        isCollapsed ? 'ml-20' : 'ml-64',
        className
      )}
    >
      {children}
    </main>
  );
}
