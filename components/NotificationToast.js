'use client';

import { useSocket } from './SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Users } from 'lucide-react';

export default function NotificationToast() {
  const { notifications, clearNotification } = useSocket();

  const getIcon = (type) => {
    switch (type) {
      case 'incident_created':
      case 'site_status':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'incident_resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'team_member_added':
      case 'team_member_removed':
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="glass-gradient border gradient-border rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => clearNotification(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
