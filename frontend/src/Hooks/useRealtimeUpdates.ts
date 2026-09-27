import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/Hooks/useWebSocket';

type DashboardRole = 'admin' | 'receptionist' | 'housekeeper';

/**
 * Hook to handle real-time updates for dashboards via Socket.io
 * Invalidates React Query cache when relevant events occur
 */
export function useRealtimeUpdates(role: DashboardRole) {
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Define events that trigger dashboard updates based on role
    const eventMapping: Record<DashboardRole, string[]> = {
      admin: [
        'payment-received',
        'new-reservation',
        'service-status-change',
        'user-approved',
        'task-completed',
      ],
      receptionist: [
        'new-reservation',
        'guest-check-in',
        'guest-check-out',
        'emergency-call',
        'room-status-change',
        'payment-received',
      ],
      housekeeper: [
        'task-assigned',
        'task-reassigned',
        'priority-change',
        'reservation-update',
      ],
    };

    const relevantEvents = eventMapping[role];

    // Handler function to invalidate dashboard cache
    const handleDashboardUpdate = (data?: any) => {
      console.log(`[Dashboard] Real-time update received for ${role}`, data);
      
      // Invalidate the dashboard query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard', role] });

      // Optional: Update specific data optimistically if structure is known
      if (data) {
        queryClient.setQueryData(['dashboard', role], (old: any) => {
          if (!old) return old;
          
          // Merge new data with old data (customize based on event type)
          return {
            ...old,
            lastUpdated: new Date().toISOString(),
            // Add event-specific optimistic updates here
          };
        });
      }
    };

    // Subscribe to all relevant events
    relevantEvents.forEach(event => {
      socket.on(event, handleDashboardUpdate);
    });

    console.log(`[Dashboard] Subscribed to ${relevantEvents.length} real-time events for ${role}`);

    // Cleanup: unsubscribe from events
    return () => {
      relevantEvents.forEach(event => {
        socket.off(event, handleDashboardUpdate);
      });
      console.log(`[Dashboard] Unsubscribed from real-time events for ${role}`);
    };
  }, [socket, role, queryClient]);
}

/**
 * Hook to listen for specific dashboard events
 * Useful for triggering UI-specific actions (notifications, sounds, etc.)
 */
export function useDashboardEvent(eventName: string, handler: (data: any) => void) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
}
