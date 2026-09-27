import React, { useState, useCallback, useRef } from 'react'

interface CropData {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

// Advanced Image Cropper Component with interactive cropping
const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [crop, setCrop] = useState<CropData>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  })
  const [zoom, setZoom] = useState(1)
  const [flip, setFlip] = useState({ horizontal: false, vertical: false })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const maxX = containerRect.width - crop.width
      const maxY = containerRect.height - crop.height

      const newX = Math.max(
        0,
        Math.min(maxX, e.clientX - containerRect.left - dragStart.x)
      )
      const newY = Math.max(
        0,
        Math.min(maxY, e.clientY - containerRect.top - dragStart.y)
      )

      setCrop((prev) => ({
        ...prev,
        x: newX,
        y: newY,
      }))
    },
    [isDragging, crop.width, crop.height, dragStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleCropSizeChange = (
    dimension: 'width' | 'height',
    value: number
  ) => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const maxSize = Math.min(containerRect.width, containerRect.height)
    const newValue = Math.max(50, Math.min(maxSize, value))

    setCrop((prev) => {
      const newCrop = { ...prev, [dimension]: newValue }

      // Adjust position if crop goes out of bounds
      if (dimension === 'width' && newCrop.x + newValue > containerRect.width) {
        newCrop.x = containerRect.width - newValue
      }
      if (
        dimension === 'height' &&
        newCrop.y + newValue > containerRect.height
      ) {
        newCrop.y = containerRect.height - newValue
      }

      return newCrop
    })
  }

  const handleCrop = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to desired output size
    const outputSize = 300
    canvas.width = outputSize
    canvas.height = outputSize

    // Get container dimensions
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Calculate the image's actual display dimensions within the container
    const imageAspectRatio = image.naturalWidth / image.naturalHeight
    const containerAspectRatio = containerRect.width / containerRect.height

    let displayWidth, displayHeight
    if (imageAspectRatio > containerAspectRatio) {
      displayWidth = containerRect.width
      displayHeight = containerRect.width / imageAspectRatio
    } else {
      displayHeight = containerRect.height
      displayWidth = containerRect.height * imageAspectRatio
    }

    // Apply zoom
    displayWidth *= zoom
    displayHeight *= zoom

    // Calculate the offset to center the zoomed image
    const offsetX = (containerRect.width - displayWidth) / 2
    const offsetY = (containerRect.height - displayHeight) / 2

    // Calculate scale factors from display to natural image size
    const scaleX = image.naturalWidth / displayWidth
    const scaleY = image.naturalHeight / displayHeight

    // Calculate crop area on the natural image
    const sourceX = Math.max(0, (crop.x - offsetX) * scaleX)
    const sourceY = Math.max(0, (crop.y - offsetY) * scaleY)
    const sourceWidth = crop.width * scaleX
    const sourceHeight = crop.height * scaleY

    // Apply transformations to context
    ctx.save()
    if (flip.horizontal || flip.vertical) {
      ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
      ctx.translate(
        flip.horizontal ? -outputSize : 0,
        flip.vertical ? -outputSize : 0
      )
    }

    // Draw the cropped and scaled image
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputSize,
      outputSize
    )
    ctx.restore()

    const croppedImage = canvas.toDataURL('image/jpeg', 0.9)
    onCropComplete(croppedImage)
  }, [crop, flip, zoom, imageLoaded, onCropComplete])

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Crop Profile Picture
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag the crop area and adjust settings below
          </p>
        </div>

        <div className="p-6">
          <div
            ref={containerRef}
            className="relative bg-gray-900 rounded-lg mb-6 overflow-hidden mx-auto flex items-center justify-center"
            style={{ width: '500px', height: '400px' }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={() => {
                setImageLoaded(true)
                // Initialize crop to center of image after loading
                if (containerRef.current) {
                  const container = containerRef.current.getBoundingClientRect()
                  setCrop({
                    x: (container.width - 200) / 2,
                    y: (container.height - 200) / 2,
                    width: 200,
                    height: 200,
                  })
                }
              }}
              onError={() => console.error('Failed to load image')}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `scale(${zoom}) ${
                  flip.horizontal ? 'scaleX(-1)' : ''
                } ${flip.vertical ? 'scaleY(-1)' : ''}`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                display: imageLoaded ? 'block' : 'none',
              }}
              draggable={false}
            />

            {/* Crop overlay */}
            {imageLoaded && (
              <>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                {/* Crop area */}
                <div
                  className="absolute border-2 border-white shadow-lg cursor-move"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-300 cursor-nw-resize" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-300 cursor-ne-resize" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-300 cursor-sw-resize" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-300 cursor-se-resize" />

                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white opacity-30" />
                    <div className="border-r border-b border-white opacity-30" />
                    <div className="border-b border-white opacity-30" />
                    <div className="border-r border-b border-white opacity-30" />
                    <div className="border-r border-b border-white opacity-30" />
                    <div className="border-b border-white opacity-30" />
                    <div className="border-r border-white opacity-30" />
                    <div className="border-r border-white opacity-30" />
                    <div />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Width: {crop.width}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={crop.width}
                  onChange={(e) =>
                    handleCropSizeChange('width', parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Height: {crop.height}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={crop.height}
                  onChange={(e) =>
                    handleCropSizeChange('height', parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Flip Options
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setFlip((prev) => ({
                        ...prev,
                        horizontal: !prev.horizontal,
                      }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      flip.horizontal
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    Flip Horizontal {flip.horizontal ? '✓' : ''}
                  </button>
                  <button
                    onClick={() =>
                      setFlip((prev) => ({ ...prev, vertical: !prev.vertical }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      flip.vertical
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    Flip Vertical {flip.vertical ? '✓' : ''}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Crop Sizes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setCrop((prev) => ({ ...prev, width: 200, height: 200 }))
                    }
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    200x200
                  </button>
                  <button
                    onClick={() =>
                      setCrop((prev) => ({ ...prev, width: 300, height: 300 }))
                    }
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    300x300
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            Crop & Save
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default ImageCropper
