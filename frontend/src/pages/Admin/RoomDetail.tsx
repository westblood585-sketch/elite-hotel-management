import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Bed, DollarSign, Hash, ZoomIn } from 'lucide-react'
import { fetchRoomById, deleteRoom, type Room } from '@/services/adminApi'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import ImageLightbox from '@/components/common/ImageLightbox'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store/store'

const RoomDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const basePath = user?.role === 'receptionist' ? '/receptionist' : '/admin'

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (id) {
      loadRoom()
    }
  }, [id])

  const loadRoom = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchRoomById(id!)
      setRoom(data)
    } catch (err: any) {
      console.error('Error fetching room:', err)
      setError(err.response?.data?.message || 'Failed to load room')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!room) return
    
    try {
      await deleteRoom(room._id)
      navigate(`${basePath}/rooms`)
    } catch (err: any) {
      console.error('Error deleting room:', err)
      alert(err.response?.data?.message || 'Failed to delete room')
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(`${basePath}/rooms`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Rooms
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error || 'Room not found'}</p>
        </div>
      </div>
    )
  }

  // Create image array
  const images = room.images && room.images.length > 0
    ? room.images.map(img => img.url)
    : room.image?.url 
      ? [room.image.url] 
      : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`${basePath}/rooms`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Rooms
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`${basePath}/rooms/edit/${room._id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={18} />
            Edit Room
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Room Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="relative group">
              <div 
                className="w-full h-96 bg-gray-200 cursor-pointer relative overflow-hidden"
                onClick={() => openLightbox(0)}
              >
                <img 
                  src={images[0]} 
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Zoom Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                    <ZoomIn size={32} className="text-white" />
                  </div>
                </div>
                {/* Click to Enlarge Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full flex items-center gap-2">
                  <ZoomIn size={16} />
                  Click to enlarge
                </div>
              </div>
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 px-8 pb-4 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => openLightbox(index)}
                    className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
                  >
                    <img 
                      src={img} 
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Title & Status */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-gray-600 mt-1">Room #{room.number}</p>
            </div>
            <span
              className={`px-4 py-2 text-sm font-medium rounded-full ${
                room.available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {room.available ? 'Available' : 'Occupied'}
            </span>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bed className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-lg font-semibold text-gray-900">{room.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Price per Night</p>
                <p className="text-lg font-semibold text-gray-900">${room.price}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Hash className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Room Number</p>
                <p className="text-lg font-semibold text-gray-900">#{room.number}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {room.description && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{room.description}</p>
            </div>
          )}

          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {room.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-700">✓ {amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        guestName={`Room ${room.number} - ${room.name}`}
      />

      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}

export default RoomDetail
