import { X, CheckCircle, XCircle, Calendar, Phone, Mail, CreditCard, FileText, Eye, MapPin, Heart, ShieldAlert, Cigarette, BedDouble, Home } from 'lucide-react'
import { type Guest } from '@/services/guestApi'
import { useState } from 'react'
import { format } from 'date-fns'

interface GuestDetailModalProps {
  isOpen: boolean
  onClose: () => void
  guest: Guest | null
  onVerifyId?: (guestId: string) => void
  onEdit?: () => void
}

const GuestDetailModal = ({ isOpen, onClose, guest, onVerifyId, onEdit }: GuestDetailModalProps) => {
  const [imageModalOpen, setImageModalOpen] = useState(false)

  if (!isOpen || !guest) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'VIP':
            return <span className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">VIP Member</span>
        case 'Loyalty':
            return <span className="px-3 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">Loyalty Program</span>
        default:
            return <span className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-full border border-gray-200">Standard</span>
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${guest.isBlacklisted ? 'bg-red-50 border-red-100' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
                {guest.isBlacklisted ? (
                     <div className="p-3 bg-red-100 rounded-full">
                        <ShieldAlert className="text-red-600" size={32} />
                     </div>
                ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                        {guest.firstName.charAt(0)}
                    </div>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {guest.firstName} {guest.lastName}
                        {guest.isBlacklisted && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">Blacklisted</span>}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(guest.status)}
                        {guest.isIdVerified ? (
                             <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                <CheckCircle size={12} fill="currentColor" className="text-green-100" /> ID Verified
                             </span>
                        ) : (
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                <XCircle size={12} /> ID Not Verified
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 {onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Edit Profile
                    </button>
                 )}
                <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                <X size={24} />
                </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Core Info */}
            <div className="lg:col-span-2 space-y-6">
                 
                 {/* Contact & Personal */}
                 <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-0.5">Email Address</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Mail size={16} className="text-gray-400" />
                                {guest.email || <span className="text-gray-400 italic">Not provided</span>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-0.5">Phone Number</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Phone size={16} className="text-gray-400" />
                                {guest.phoneNumber}
                            </div>
                        </div>
                        <div>
                             <p className="text-xs font-medium text-gray-500 mb-0.5">Date of Birth</p>
                             <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Calendar size={16} className="text-gray-400" />
                                {guest.dateOfBirth ? format(new Date(guest.dateOfBirth), 'MMMM d, yyyy') : <span className="text-gray-400 italic">--</span>}
                             </div>
                        </div>
                        <div>
                             <p className="text-xs font-medium text-gray-500 mb-0.5">Member Since</p>
                             <div className="text-gray-900 font-medium">
                                {guest.createdAt ? format(new Date(guest.createdAt), 'MMM d, yyyy') : '-'}
                             </div>
                        </div>
                    </div>
                 </div>

                 {/* Address Card */}
                 <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-500" /> Address Details
                     </h3>
                     {guest.address && (guest.address.line1 || guest.address.city) ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                             <div className="col-span-2">
                                <p className="font-medium text-gray-900">{guest.address.line1}</p>
                                {guest.address.line2 && <p className="text-gray-600">{guest.address.line2}</p>}
                             </div>
                             <div>
                                <p className="text-xs text-gray-500">City</p>
                                <p className="font-medium text-gray-900">{guest.address.city || '-'}</p>
                             </div>
                             <div>
                                <p className="text-xs text-gray-500">State</p>
                                <p className="font-medium text-gray-900">{guest.address.state || '-'}</p>
                             </div>
                             <div>
                                <p className="text-xs text-gray-500">Postal Code</p>
                                <p className="font-medium text-gray-900">{guest.address.postalCode || '-'}</p>
                             </div>
                             <div>
                                <p className="text-xs text-gray-500">Country</p>
                                <p className="font-medium text-gray-900">{guest.address.country || '-'}</p>
                             </div>
                        </div>
                     ) : (
                        <p className="text-gray-400 italic text-sm">No address information on file.</p>
                     )}
                 </div>

                 {/* Preferences Card */}
                 <div className="bg-pink-50 rounded-xl border border-pink-100 p-5">
                     <h3 className="text-sm font-bold text-pink-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Heart size={18} className="text-pink-500" /> Stay Preferences
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-pink-100 flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-md text-pink-600">
                                <Cigarette size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Smoking</p>
                                <p className="text-sm font-medium text-gray-900">{guest.preferences?.smoking ? 'Allowed' : 'Non-Smoking'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-pink-100 flex items-center gap-3">
                             <div className="p-2 bg-pink-100 rounded-md text-pink-600">
                                <Home size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Room Type</p>
                                <p className="text-sm font-medium text-gray-900">{guest.preferences?.roomType || 'Any'}</p>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-pink-100 flex items-center gap-3">
                             <div className="p-2 bg-pink-100 rounded-md text-pink-600">
                                <BedDouble size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Bed Type</p>
                                <p className="text-sm font-medium text-gray-900">{guest.preferences?.bedType || 'Any'}</p>
                            </div>
                        </div>
                     </div>
                     {guest.preferences?.notes && (
                         <div className="mt-4 pt-4 border-t border-pink-200">
                            <p className="text-xs font-bold text-pink-700 uppercase mb-1">Notes</p>
                            <p className="text-sm text-gray-700 italic">"{guest.preferences.notes}"</p>
                         </div>
                     )}
                 </div>
            </div>

            {/* Right Column: ID & Notes */}
            <div className="space-y-6">
                
                {/* ID Proof Card */}
                <div className="bg-white rounded-xl border-2 border-dashed border-blue-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard size={18} /> ID Document
                        </h3>
                        {guest.isIdVerified ? <CheckCircle className="text-green-500" size={18} /> : <XCircle className="text-gray-300" size={18} />}
                    </div>

                    <div className="space-y-3 mb-4">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Document Type</p>
                            <p className="font-medium text-gray-900">{guest.idProof?.type || 'Not Provided'}</p>
                        </div>
                        <div>
                             <p className="text-xs text-gray-400 uppercase font-bold">Document Number</p>
                            <p className="font-medium text-gray-900 font-mono tracking-wide">{guest.idProof?.number || '---'}</p>
                        </div>
                    </div>

                    {guest.idProof?.image?.url ? (
                        <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img
                                src={guest.idProof.image.url}
                                alt="ID Proof"
                                className="w-full h-40 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setImageModalOpen(true)}
                                    className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"
                                    title="View Fullscreen"
                                >
                                    <Eye size={20} />
                                </button>
                            </div>
                            
                            {!guest.isIdVerified && onVerifyId && (
                                <button
                                    onClick={() => onVerifyId(guest._id)}
                                    className="absolute bottom-0 w-full bg-green-600 text-white text-xs font-bold py-2 hover:bg-green-700 transition-colors"
                                >
                                    VERIFY THIS ID
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
                            <FileText className="block mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-xs text-gray-500">No document uploaded</p>
                        </div>
                    )}
                </div>

                {/* Admin Notes */}
                {guest.notes && (
                    <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
                        <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2">Staff Notes</h3>
                        <p className="text-sm text-amber-900 leading-relaxed">
                            {guest.notes}
                        </p>
                    </div>
                )}

            </div>
          </div>
        </div>
      </div>

      {imageModalOpen && guest.idProof?.image?.url && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-4">
          <button
            onClick={() => setImageModalOpen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
          <img
            src={guest.idProof.image.url}
            alt="ID Proof Full View"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  )
}

export default GuestDetailModal
