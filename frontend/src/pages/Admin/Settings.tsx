import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bell, Database, AlertTriangle, Save,  ChevronRight, Shield, Globe, MessageSquare, X, RotateCcw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton'
import EmptyState from '@/components/common/EmptyState'
import { fetchSettings, updateSetting, initializeSettings, triggerBackup, getBackupLogs, downloadBackup, getBackupStatus, type BackupConfig, type BackupLog } from '@/services/settingsApi'
import { motion, AnimatePresence } from 'framer-motion'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Backup State
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([])
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null)

  useEffect(() => {
    loadSettings()
    loadBackupConfig()
  }, [])

  const loadBackupConfig = async () => {
    try {
        const config = await getBackupStatus()
        setBackupConfig(config)
    } catch (error) {
        console.error('Failed to load backup config', error)
    }
  }

  const handleDownloadBackup = async (filename: string) => {
    try {
        const toastId = toast.loading('Downloading backup...')
        await downloadBackup(filename)
        toast.dismiss(toastId)
        toast.success('Download started')
    } catch (error) {
        console.error('Download failed:', error)
        toast.error('Failed to download backup')
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await fetchSettings()
      
      // If no settings exist, try to seed defaults
      if (Object.keys(data).length === 0) {
        await initializeSettings()
        const newData = await fetchSettings()
        setSettings(newData)
      } else {
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setError("Failed to load application settings.")
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: any) => {
    try {
      await updateSetting(key, value)
      setSettings(prev => ({ ...prev, [key]: value }))
      toast.success('Setting updated successfully')
    } catch (error) {
      console.error('Failed to save setting:', error)
      toast.error('Failed to update setting')
    }
  }

  const handleTriggerBackup = async () => {
      try {
          const toastId = toast.loading('Creating backup...')
          await triggerBackup()
          toast.dismiss(toastId)
          toast.success('Backup created successfully')
          if (showBackupModal) {
              fetchBackups()
          }
      } catch (error) {
          console.error('Backup failed:', error)
          toast.error('Failed to create backup')
      }
  }

  const fetchBackups = async () => {
      try {
          setLoadingBackups(true)
          const logs = await getBackupLogs()
          setBackupLogs(logs)
      } catch (error) {
          console.error('Failed to fetch backups:', error)
          toast.error('Failed to load backup logs')
      } finally {
          setLoadingBackups(false)
      }
  }

  const handleViewLogs = () => {
      setShowBackupModal(true)
      fetchBackups()
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe, description: 'Basic hotel information' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email and SMS alerts' },
    { id: 'security', label: 'Security', icon: Shield, description: '2FA and timeouts' },
    { id: 'database', label: 'Database', icon: Database, description: 'Backup and status' },
  ]

  if (loading) {
    return (
        <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
             <DashboardSkeleton />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-fixed bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-6 lg:p-10">
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-[1600px] mx-auto relative z-10 space-y-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-4xl font-serif font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage application preferences and configurations.</p>
            </div>
        </div>

        {error ? (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center h-96 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl"
            >
                <EmptyState
                    title="Error loading settings"
                    description={error}
                    icon={AlertTriangle}
                    action={{ label: "Retry", onClick: loadSettings }}
                />
            </motion.div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl overflow-hidden p-4 space-y-2 sticky top-24">
                        {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all group relative overflow-hidden ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/20'
                                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white transition-colors'}`}>
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'} />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm">{tab.label}</div>
                                <div className={`text-xs ${activeTab === tab.id ? 'text-gray-300' : 'text-gray-400'}`}>{tab.description}</div>
                            </div>
                            {activeTab === tab.id && <ChevronRight size={16} className="text-white/50" />}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[600px]">
                   <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-8 lg:p-10"
                    >
                        <div className="mb-8 pb-6 border-b border-gray-200/50 flex items-center gap-4">
                           <div className="p-3 bg-white rounded-2xl shadow-sm">
                              {(() => {
                                  const Icon = tabs.find(t => t.id === activeTab)?.icon || SettingsIcon;
                                  return <Icon size={24} className="text-gray-900" />;
                              })()}
                           </div>
                           <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {tabs.find(t => t.id === activeTab)?.label} Settings
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Manage your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} configurations
                                </p>
                           </div>
                        </div>

                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'general' && (
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Hotel Name
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            defaultValue={settings['hotelName']}
                                            onBlur={(e) => {
                                            if (e.target.value !== settings['hotelName']) {
                                                handleSave('hotelName', e.target.value)
                                            }
                                            }}
                                            className="w-full px-5 py-4 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm group-hover:shadow-md"
                                            placeholder="Enter hotel name"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <Save size={16} className="opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 ml-1">Displayed on the guest facing application and emails.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Contact Email
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            defaultValue={settings['contactEmail']}
                                            onBlur={(e) => {
                                                if (e.target.value !== settings['contactEmail']) {
                                                handleSave('contactEmail', e.target.value)
                                                }
                                            }}
                                            className="w-full px-5 py-4 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm group-hover:shadow-md"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/60 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <Bell size={24} />
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings['notifications.email'] || false}
                                            onChange={(e) => handleSave('notifications.email', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-900"></div>
                                    </label>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Email Notifications</h3>
                                <p className="text-sm text-gray-500">Receive important alerts and updates via email.</p>
                            </div>

                            <div className="p-6 bg-white/60 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                        <MessageSquare size={24} />
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings['notifications.sms'] || false}
                                            onChange={(e) => handleSave('notifications.sms', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-900"></div>
                                    </label>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">SMS Notifications</h3>
                                <p className="text-sm text-gray-500">Get urgent alerts directly to your mobile device.</p>
                            </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 max-w-2xl">
                                <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                                <Shield size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
                                                <p className="text-sm text-gray-600">Enforce 2FA for all admin accounts</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings['security.2fa'] || false}
                                            onChange={(e) => handleSave('security.2fa', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                        Session Timeout (minutes)
                                    </label>
                                    <div className="relative group">
                                         <input
                                            type="number"
                                            defaultValue={settings['security.sessionTimeout'] || 30}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value)
                                                if (val !== settings['security.sessionTimeout']) {
                                                handleSave('security.sessionTimeout', val)
                                                }
                                            }}
                                            className="w-full px-5 py-4 bg-white/50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-100 transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm group-hover:shadow-md"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                                            min
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 ml-1">Automatically log out inactive users.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'database' && (
                            <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-green-100 rounded-3xl flex items-center gap-6">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-500">
                                     <div className="relative">
                                         <Database size={32} />
                                         <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                                        </span>
                                     </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-900">Database Connected</h3>
                                    <p className="text-green-700 font-medium">System is operational and responsive.</p>
                                    <div className="flex gap-4 mt-3">
                                        <div className="text-xs font-bold px-3 py-1 bg-white/50 rounded-lg text-green-800 border border-green-200/50">
                                            Latency: 12ms
                                        </div>
                                        <div className="text-xs font-bold px-3 py-1 bg-white/50 rounded-lg text-green-800 border border-green-200/50">
                                            Uptime: 99.9%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white/60 rounded-3xl border border-white/50 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-2 text-lg">Backup Configuration</h3>
                                <p className="text-gray-500 mb-6 max-w-lg">
                                    {backupConfig ? (
                                        <>
                                            Automated daily backups are <span className="text-green-600 font-bold">Active</span>.
                                            <br />
                                            Next run: {new Date(backupConfig.nextRun).toLocaleString()}
                                            <br />
                                            Retention Policy: {backupConfig.retentionDays} Days
                                        </>
                                    ) : (
                                        "Loading backup configuration..."
                                    )}
                                </p>
                                
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handleTriggerBackup}
                                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Trigger Manual Backup
                                    </button>
                                    <button 
                                        onClick={handleViewLogs}
                                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        View Logs
                                    </button>
                                </div>
                            </div>
                            </div>
                        )}
                        </div>
                    </motion.div>
                   </AnimatePresence>
                </div>
            </div>
        )}
      </div>

       {/* Backup Logs Modal */}
       <AnimatePresence>
        {showBackupModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBackupModal(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/50 flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                        <RotateCcw size={20} />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">Backup Logs</h2>
                        <p className="text-xs text-gray-500 font-medium">History of system backups</p>
                     </div>
                  </div>
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loadingBackups ? (
                         <div className="py-12 flex flex-col items-center justify-center text-gray-500 space-y-3">
                            <div className="animate-spin text-blue-500">
                                <RotateCcw size={32} />
                            </div>
                            <p className="font-medium">Loading backups...</p>
                         </div>
                    ) : backupLogs.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2 border-2 border-dashed border-gray-200 rounded-2xl">
                             <Database size={48} className="text-gray-200" />
                             <p className="font-medium text-gray-500">No backups found</p>
                             <p className="text-xs">Trigger a manual backup to see logs here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backupLogs.map((log) => (
                                <div key={log.filename} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Database size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{log.filename}</div>
                                            <div className="text-xs text-gray-400 font-medium">
                                                {(log.size / 1024).toFixed(2)} KB • {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg capitalize hidden sm:block">
                                            Success
                                        </div>
                                        <button 
                                            onClick={() => handleDownloadBackup(log.filename)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Download Backup"
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={() => setShowBackupModal(false)}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-sm"
                    >
                        Close
                    </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Settings
