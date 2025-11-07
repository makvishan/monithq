'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

const PusherContext = createContext(null);

export const useSocket = () => {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [pusher, setPusher] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);

  const { user } = require('@/contexts/AuthContext').useAuth();
  useEffect(() => {
    if (user?.organizationId) {
      setOrganizationId(user.organizationId);
    }
  }, [user]);

  useEffect(() => {
    if (!organizationId) return;

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });

    pusherClient.connection.bind('connected', () => {
      console.log('Pusher connected');
      setConnected(true);
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      setConnected(false);
    });

    // Subscribe to organization channel
    const channel = pusherClient.subscribe(`org-${organizationId}`);

    // Listen for incident events
    channel.bind('incident:created', (incident) => {
      addNotification({
        id: Date.now(),
        type: 'incident_created',
        title: 'New Incident',
        message: `${incident.site?.name || 'A site'} is experiencing issues`,
        data: incident,
        timestamp: new Date(),
      });
    });

    channel.bind('incident:updated', (incident) => {
      addNotification({
        id: Date.now(),
        type: 'incident_updated',
        title: 'Incident Updated',
        message: `Incident for ${incident.site?.name || 'site'} was updated`,
        data: incident,
        timestamp: new Date(),
      });
    });

    channel.bind('incident:resolved', (incident) => {
      addNotification({
        id: Date.now(),
        type: 'incident_resolved',
        title: 'Incident Resolved',
        message: `${incident.site?.name || 'Site'} incident has been resolved`,
        data: incident,
        timestamp: new Date(),
      });
    });

    // Listen for site status changes
    channel.bind('site:status_changed', (site) => {
      const status = site.status.toLowerCase();
      if (status === 'offline' || status === 'degraded') {
        addNotification({
          id: Date.now(),
          type: 'site_status',
          title: 'Site Status Changed',
          message: `${site.name} is now ${status}`,
          data: site,
          timestamp: new Date(),
        });
      }
    });

    // Listen for team events
    channel.bind('team:member_added', (member) => {
      addNotification({
        id: Date.now(),
        type: 'team_member_added',
        title: 'Team Member Added',
        message: `${member.email} joined your team`,
        data: member,
        timestamp: new Date(),
      });
    });

    channel.bind('team:member_removed', (data) => {
      addNotification({
        id: Date.now(),
        type: 'team_member_removed',
        title: 'Team Member Removed',
        message: 'A team member was removed',
        data,
        timestamp: new Date(),
      });
    });

    setPusher(pusherClient);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.disconnect();
    };
  }, [organizationId]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    socket: pusher,
    connected,
    notifications,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <PusherContext.Provider value={value}>
      {children}
    </PusherContext.Provider>
  );
};
