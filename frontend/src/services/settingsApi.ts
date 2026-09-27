
import { privateApi } from '@/services/instances/axiosConfig'

export interface Setting {
  key: string
  value: any
  category: string
  isPublic: boolean
}

export const fetchSettings = async (category?: string): Promise<Record<string, any>> => {
  const params = category ? { category } : {}
  const response = await privateApi.get('/users/settings', { params })
  return response.data.data
}

export const updateSetting = async (key: string, value: any): Promise<Setting> => {
  const response = await privateApi.put(`/users/settings/${key}`, { value })
  return response.data.data
}

export const initializeSettings = async (): Promise<void> => {
  await privateApi.post('/users/settings/seed')
}

export interface BackupLog {
  filename: string
  createdAt: string
  size: number
}

export const triggerBackup = async (): Promise<{ filename: string }> => {
  const response = await privateApi.post('/users/backups')
  return response.data.data
}

export const getBackupLogs = async (): Promise<BackupLog[]> => {
  const response = await privateApi.get('/users/backups')
  return response.data.data
}

export const downloadBackup = async (filename: string): Promise<void> => {
  const response = await privateApi.get(`/users/backups/${filename}`, {
    responseType: 'blob',
  })
  
  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename) // Set the filename
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  link.parentNode?.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export interface BackupConfig {
  enabled: boolean;
  retentionDays: number;
  nextRun: string;
}

export const getBackupStatus = async (): Promise<BackupConfig> => {
  const response = await privateApi.get('/users/backups/status')
  return response.data.data
}
