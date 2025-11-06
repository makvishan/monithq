'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { SIDEBAR_LINKS, ORG_ADMIN_SIDEBAR_LINKS, ADMIN_SIDEBAR_LINKS, USER_ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { logout } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  // Get user from localStorage
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);
  
  const userRole = currentUser?.role || USER_ROLES.USER;
  
  const isSuperAdmin = userRole === USER_ROLES.SUPER_ADMIN;
  const isOrgAdmin = userRole === USER_ROLES.ORG_ADMIN;
  const isRegularUser = userRole === USER_ROLES.USER;

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Determine which links to show based on role
  const getUserLinks = () => {
    if (isSuperAdmin) {
      // Super Admin: NO user features, only platform admin
      return [];
    }
    if (isRegularUser) {
      // Regular user: Dashboard, Sites, Insights, Incidents, API Keys, Webhooks, Settings
      return SIDEBAR_LINKS.filter(link => 
        ['Dashboard', 'Sites', 'Insights', 'Incidents', 'API Keys', 'Webhooks', 'Settings'].includes(link.label)
      );
    }
    // Org Admin sees ALL user links including Billing and Settings
    return SIDEBAR_LINKS;
  };

  return (
    <>
      {/* Logout Confirmation Modal - Outside sidebar for proper z-index */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <LucideIcons.LogOut className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Logout</h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to logout? You will need to sign in again to access your account.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <aside 
        className={cn(
          'fixed left-0 top-0 bottom-0 bg-card border-r border-border overflow-y-auto transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-ai rounded-lg flex items-center justify-center glow-ai shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold gradient-text whitespace-nowrap">MonitHQ</span>
          )}
        </Link>
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-2 rounded-lg hover:bg-muted transition-colors shrink-0',
            isCollapsed && 'mx-auto'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <LucideIcons.ChevronRight className="w-5 h-5 text-muted-foreground" />
          ) : (
            <LucideIcons.ChevronLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {/* Regular User Links */}
        {getUserLinks().map((link) => {
          const Icon = LucideIcons[link.icon];
          // Only highlight exact matches, not related pages
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all group relative',
                isCollapsed ? 'justify-center px-4 py-3' : 'space-x-3 px-4 py-3',
                isActive
                  ? 'gradient-ai text-white glow-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={isCollapsed ? link.label : ''}
            >
              {Icon && <Icon className="w-5 h-5 shrink-0" />}
              {!isCollapsed && <span>{link.label}</span>}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Organization Admin Section */}
        {isOrgAdmin && (
          <>
            <div className="my-4 relative">
              {!isCollapsed ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium px-2">ORGANIZATION</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              ) : (
                <div className="h-px bg-border"></div>
              )}
            </div>

            {/* Org Admin Links */}
            {ORG_ADMIN_SIDEBAR_LINKS.map((link) => {
              const Icon = LucideIcons[link.icon];
              // Use exact path matching to prevent highlighting related pages
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-all group relative',
                    isCollapsed ? 'justify-center px-4 py-3' : 'space-x-3 px-4 py-3',
                    isActive
                      ? 'gradient-success text-white glow-success'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={isCollapsed ? link.label : ''}
                >
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  {!isCollapsed && <span>{link.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border">
                      {link.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </>
        )}

        {/* Super Admin Section (MonitHQ Platform) */}
        {isSuperAdmin && (
          <>
            <div className="my-4 relative">
              {!isCollapsed ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground font-medium px-2">PLATFORM ADMIN</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              ) : (
                <div className="h-px bg-border"></div>
              )}
            </div>

            {/* Admin Links */}
            {ADMIN_SIDEBAR_LINKS.map((link) => {
              const Icon = LucideIcons[link.icon];
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-all group relative',
                    isCollapsed ? 'justify-center px-4 py-3' : 'space-x-3 px-4 py-3',
                    isActive
                      ? 'gradient-warning text-white glow-warning'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={isCollapsed ? link.label : ''}
                >
                  {Icon && <Icon className="w-5 h-5 shrink-0" />}
                  {!isCollapsed && <span>{link.label}</span>}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border">
                      {link.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card">
        {/* Logout Button */}
        <div className="p-4 border-b border-border">
          <button
            onClick={confirmLogout}
            className={cn(
              'w-full flex items-center rounded-lg text-sm font-medium transition-all group hover:bg-red-500/10 hover:text-red-500',
              isCollapsed ? 'justify-center px-4 py-3' : 'space-x-3 px-4 py-3',
              'text-muted-foreground relative'
            )}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LucideIcons.LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border">
                Logout
              </div>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4">
          <div className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center' : 'space-x-3'
          )}>
            <div className="w-10 h-10 rounded-full gradient-ai flex items-center justify-center text-white font-semibold glow-primary shrink-0 relative">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD'}
              {(isOrgAdmin || isSuperAdmin) && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center",
                  isSuperAdmin ? "bg-red-500" : "bg-green-500"
                )}>
                  <LucideIcons.Shield className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser?.name || 'John Doe'}
                  </p>
                  {isSuperAdmin && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 rounded">
                      Super Admin
                    </span>
                  )}
                  {isOrgAdmin && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 rounded">
                      Org Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.email || 'john@example.com'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
