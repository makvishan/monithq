// Pusher real-time service (Vercel-compatible)
import Pusher from 'pusher';

let pusherServer;

export const getPusherServer = () => {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  return pusherServer;
};

// Broadcast functions for real-time notifications
export const notifyIncidentCreated = async (incident, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'incident:created', incident);
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};

export const notifyIncidentUpdated = async (incident, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'incident:updated', incident);
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};

export const notifyIncidentResolved = async (incident, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'incident:resolved', incident);
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};

export const notifySiteStatusChanged = async (site, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'site:status_changed', site);
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};

export const notifyTeamMemberAdded = async (member, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'team:member_added', member);
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};

export const notifyTeamMemberRemoved = async (userId, organizationId) => {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`org-${organizationId}`, 'team:member_removed', { userId });
  } catch (error) {
    console.error('Error sending Pusher notification:', error);
  }
};
