import { useState, useEffect } from 'react'
import { X, User, Upload, MapPin, Heart, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import { createGuest, updateGuest, type Guest } from '@/services/guestApi'

interface GuestFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  guest?: Guest | null
}

const GuestFormModal = ({ isOpen, onClose, onSuccess, guest }: GuestFormModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dob: '',
    status: 'Standard' as 'Standard' | 'VIP' | 'Loyalty',
    isBlacklisted: false,
    
    // Address
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',

    // Preferences
    smoking: false,
    roomType: '',
    bedType: '',
    prefNotes: '',

    // ID Proof
    idProofType: '',
    idProofNumber: '',
    notes: '',
  })

  // UI States
  const [showAddress, setShowAddress] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (guest) {
      setFormData({
        firstName: guest.firstName || '',
        lastName: guest.lastName || '',
        email: guest.email || '',
        phoneNumber: guest.phoneNumber || '',
        dob: guest.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : '',
        status: guest.status || 'Standard',
        isBlacklisted: guest.isBlacklisted || false,
        
        line1: guest.address?.line1 || '',
        line2: guest.address?.line2 || '',
        city: guest.address?.city || '',
        state: guest.address?.state || '',
        postalCode: guest.address?.postalCode || '',
        country: guest.address?.country || '',

        smoking: guest.preferences?.smoking || false,
        roomType: guest.preferences?.roomType || '',
        bedType: guest.preferences?.bedType || '',
        prefNotes: guest.preferences?.notes || '',

        idProofType: guest.idProof?.type || '',
        idProofNumber: guest.idProof?.number || '',
        notes: guest.notes || '',
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dob: '',
        status: 'Standard',
        isBlacklisted: false,
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        smoking: false,
        roomType: '',
        bedType: '',
        prefNotes: '',
        idProofType: '',
        idProofNumber: '',
        notes: '',
      })
      setIdCardFile(null)
      setIdCardPreview(null)
      setShowAddress(false)
      setShowPreferences(false)
    }
  }, [guest, isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdCardFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdCardPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setIdCardFile(null)
    setIdCardPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        status: formData.status,
        isBlacklisted: formData.isBlacklisted,
        notes: formData.notes,
        dateOfBirth: formData.dob || undefined,
        address: {
          line1: formData.line1,
          line2: formData.line2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        preferences: {
            smoking: formData.smoking,
            roomType: formData.roomType,
            bedType: formData.bedType,
            notes: formData.prefNotes,
        }
      }

      if (formData.idProofType || formData.idProofNumber) {
        payload.idProof = {
          type: formData.idProofType,
          number: formData.idProofNumber,
        }
      }

      if (guest) {
        // Update existing guest
        const promises = [updateGuest(guest._id, payload)]
        
        if (idCardFile) {
          const { updateGuestIdProofImage } = await import('@/services/guestApi')
          promises.push(updateGuestIdProofImage(guest._id, idCardFile))
        }

        await Promise.all(promises)
      } else {
        // Create new guest
        // Note: For complex nesting with FormData, it's often cleaner to send JSON unless file is required strictly in create.
        // But backend controller expects req.body and req.file separated or parsed.
        // Given the complexity of deep nesting in FormData, let's try sending JSON if no file, 
        // OR construct FormData carefully with dot notation which express/multer parsers usually handle or using a library.
        // HOWEVER, our guestApi createGuest handles FormData or JSON.
        
        // Strategy: Use FormData with Flattened Keys for Create
        const fd = new FormData()
        fd.append('firstName', formData.firstName)
        if (formData.lastName) fd.append('lastName', formData.lastName)
        if (formData.email) fd.append('email', formData.email)
        fd.append('phoneNumber', formData.phoneNumber)
        fd.append('status', formData.status)
        fd.append('isBlacklisted', String(formData.isBlacklisted))
        if(formData.dob) fd.append('dateOfBirth', formData.dob)
        if (formData.notes) fd.append('notes', formData.notes)

        // Address
        if(formData.line1) fd.append('address[line1]', formData.line1)
        if(formData.line2) fd.append('address[line2]', formData.line2)
        if(formData.city) fd.append('address[city]', formData.city)
        if(formData.state) fd.append('address[state]', formData.state)
        if(formData.postalCode) fd.append('address[postalCode]', formData.postalCode)
        if(formData.country) fd.append('address[country]', formData.country)

        // Preferences
        fd.append('preferences[smoking]', String(formData.smoking))
        if(formData.roomType) fd.append('preferences[roomType]', formData.roomType)
        if(formData.bedType) fd.append('preferences[bedType]', formData.bedType)
        if(formData.prefNotes) fd.append('preferences[notes]', formData.prefNotes)
        
        // ID Proof
        if (formData.idProofType) fd.append('idProof[type]', formData.idProofType)
        if (formData.idProofNumber) fd.append('idProof[number]', formData.idProofNumber)
        if (idCardFile) fd.append('idProofImage', idCardFile)

        await createGuest(fd)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving guest:', err)
      setError(err.response?.data?.message || 'Failed to save guest')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.isBlacklisted ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {formData.isBlacklisted ? <ShieldAlert className="text-red-600" size={24} /> : <User className="text-blue-600" size={24} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                    {guest ? 'Edit Profile' : 'New Guest'}
                    </h2>
                    {formData.isBlacklisted && <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Blacklisted Profile</span>}
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <X size={24} />
            </button>
            </div>

            <div className="p-6 space-y-8">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <ShieldAlert size={20} />
                    {error}
                </div>
            )}

            {/* Section 1: Core Identity */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Identity & Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Section 2: Address (Collapsible) */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setShowAddress(!showAddress)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-2 font-bold text-gray-700">
                        <MapPin size={18} className="text-gray-500" />
                        Address Details
                    </div>
                    {showAddress ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {showAddress && (
                    <div className="p-4 border-t border-gray-200 grid grid-cols-2 gap-4 bg-white">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
                            <input
                                type="text"
                                placeholder="Line 1"
                                value={formData.line1}
                                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                                className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                placeholder="Line 2 (Optional)"
                                value={formData.line2}
                                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State / Province</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Postal Code</label>
                            <input
                                type="text"
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Section 3: Preferences (Collapsible) */}
            <div className="bg-pink-50/50 rounded-xl border border-pink-100 overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="w-full flex items-center justify-between p-4 hover:bg-pink-50 transition-colors"
                >
                    <div className="flex items-center gap-2 font-bold text-pink-700">
                        <Heart size={18} className="text-pink-500" />
                        Stay Preferences
                    </div>
                    {showPreferences ? <ChevronUp size={18} className="text-pink-400" /> : <ChevronDown size={18} className="text-pink-400" />}
                </button>
                
                {showPreferences && (
                    <div className="p-4 border-t border-pink-100 grid grid-cols-2 gap-4 bg-white">
                         <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                             <input 
                                type="checkbox"
                                id="smoking"
                                checked={formData.smoking}
                                onChange={(e) => setFormData({...formData, smoking: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                             />
                             <label htmlFor="smoking" className="font-medium text-gray-700">Smoking Room Allowed</label>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Room</label>
                            <select
                                value={formData.roomType}
                                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No Preference</option>
                                <option value="Standard">Standard</option>
                                <option value="Deluxe">Deluxe</option>
                                <option value="Premium">Premium</option>
                                <option value="Luxury">Luxury</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preferred Bed</label>
                            <select
                                value={formData.bedType}
                                onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">No Preference</option>
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Queen">Queen</option>
                                <option value="King">King</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preference Notes</label>
                             <textarea
                                value={formData.prefNotes}
                                onChange={(e) => setFormData({ ...formData, prefNotes: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="E.g., High floor, away from elevator..."
                             />
                        </div>
                    </div>
                )}
            </div>

            {/* Section 4: Security & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Loyalty Tier</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Standard">Standard</option>
                        <option value="VIP">VIP (Gold)</option>
                        <option value="Loyalty">Loyalty Member</option>
                    </select>
                </div>

                <div className="flex items-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-colors">
                     <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-900 mb-1">Blacklist Guest</label>
                        <p className="text-xs text-gray-500">Deny future bookings/entry.</p>
                     </div>
                     <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="toggle" 
                            id="blacklist-toggle" 
                            checked={formData.isBlacklisted}
                            onChange={(e) => setFormData({...formData, isBlacklisted: e.target.checked})}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer duration-300 ease-in-out checked:right-0 unchecked:right-6 checked:border-red-500"
                            style={{ right: formData.isBlacklisted ? '0' : '50%' }}
                        />
                         <label htmlFor="blacklist-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.isBlacklisted ? 'bg-red-500' : 'bg-gray-300'}`}></label>
                    </div>
                </div>
            </div>

            {/* Section 5: ID Proof */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <User size={16} /> ID Documentation
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Type</label>
                        <select
                            value={formData.idProofType}
                            onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Type</option>
                            <option value="Passport">Passport</option>
                            <option value="NationalID">National ID</option>
                            <option value="DrivingLicense">Driving License</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Number</label>
                        <input
                            type="text"
                            value={formData.idProofNumber}
                            onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scanned Document</label>
                    {!idCardPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="id-card-upload-modal"
                            />
                            <label htmlFor="id-card-upload-modal" className="cursor-pointer flex flex-col items-center">
                                <Upload className="text-blue-500 mb-2" size={24} />
                                <span className="text-sm font-medium text-blue-600">Upload Image</span>
                            </label>
                        </div>
                    ) : (
                        <div className="relative group">
                            <img
                                src={idCardPreview}
                                alt="ID Card Preview"
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                                type="button"
                                onClick={removeFile}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* General Notes */}
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                 <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Internal notes about this guest..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 />
            </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium shadow-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-bold shadow-lg shadow-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : null}
                    {guest ? 'Update Profile' : 'Create Guest'}
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

export default GuestFormModal
