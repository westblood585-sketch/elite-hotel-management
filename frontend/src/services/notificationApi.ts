import { privateApi } from '@/services/instances/axiosConfig';

export const getNotifications = async (role?: string) => {
  const response = await privateApi.get('/notifications/', { params: { role } });
  return response.data;
};

export const markAsRead = async (id: string) => {
  const response = await privateApi.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await privateApi.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await privateApi.delete(`/notifications/${id}`);
  return response.data;
};
