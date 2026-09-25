import dotenv from 'dotenv'
dotenv.config()
import connectMongoDB from '../config/db.config'
import { Room } from '../models/room.model'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import s3Client, { S3_BUCKET } from '../config/s3.config'
import axios from 'axios'

const rooms = [
  {
    number: 1,
    name: 'Ocean View Family Suite',
    type: 'Premium',
    price: 249,
    image: {
      publicId: 'ocean-view-family-suite-1',
      url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
    },
    description:
      'Spacious family suite with breathtaking ocean views, perfect for families seeking luxury and comfort with premium amenities.',
    amenities: [
      'Free WiFi',
      'Ocean View',
      'Breakfast',
      'Family Friendly',
      'Mini Bar',
      'Balcony',
    ],
    size: 60,
    capacity: 5,
    category: 'Family',
    rating: 4.8,
    available: true,
  },
  {
    number: 2,
    name: 'Cozy Single Retreat',
    type: 'Standard',
    price: 129,
    image: {
      publicId: 'cozy-single-retreat-2',
      url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    },
    description:
      'Intimate single room with beautiful landscape views, designed for solo travelers who appreciate comfort and tranquility.',
    amenities: ['Free WiFi', 'TV', 'Breakfast', 'Work Desk', 'Coffee Machine'],
    size: 25,
    capacity: 1,
    category: 'Single',
    rating: 4.2,
    available: false,
  },
  {
    number: 3,
    name: 'Deluxe Garden Suite',
    type: 'Deluxe',
    price: 189,
    image: {
      publicId: 'deluxe-garden-suite-3',
      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
    },
    description:
      'Elegant room with private garden access and premium furnishings, offering a perfect blend of luxury and nature.',
    amenities: [
      'Free WiFi',
      'Garden View',
      'Breakfast',
      'Premium Bedding',
      'Coffee Machine',
      'Private Terrace',
    ],
    size: 35,
    capacity: 2,
    category: 'Double',
    rating: 4.6,
    available: true,
  },
  {
    number: 4,
    name: 'Executive Business Suite',
    type: 'Premium',
    price: 299,
    image: {
      publicId: 'executive-business-suite-4',
      url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
    },
    description:
      'Our finest accommodation with panoramic city views, separate living area, and exclusive executive amenities for discerning guests.',
    amenities: [
      'Free WiFi',
      'City View',
      'Breakfast',
      'Mini Bar',
      'Coffee Machine',
      'Bathtub',
      'Butler Service',
      'Executive Lounge',
    ],
    size: 65,
    capacity: 3,
    category: 'Suite',
    rating: 4.9,
    available: true,
  },
  {
    number: 5,
    name: 'Junior Honeymoon Suite',
    type: 'Premium',
    price: 219,
    image: {
      publicId: 'junior-honeymoon-suite-5',
      url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
    },
    description:
      'Romantic junior suite with champagne service and luxury amenities, perfect for special occasions and romantic getaways.',
    amenities: [
      'Free WiFi',
      'Romantic Setup',
      'Breakfast',
      'Mini Bar',
      'Jacuzzi',
      'Sitting Area',
      'Champagne Service',
    ],
    size: 45,
    capacity: 2,
    category: 'Suite',
    rating: 4.7,
    available: false,
  },
  {
    number: 6,
    name: 'Mountain View Lodge',
    type: 'Deluxe',
    price: 169,
    image: {
      publicId: 'mountain-view-lodge-6',
      url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    },
    description:
      'Rustic yet elegant room with stunning mountain vistas and cozy fireplace, ideal for nature enthusiasts.',
    amenities: [
      'Free WiFi',
      'Mountain View',
      'Breakfast',
      'Fireplace',
      'Coffee Machine',
      'Hiking Gear Storage',
    ],
    size: 40,
    capacity: 3,
    category: 'Triple',
    rating: 4.4,
    available: true,
  },
  {
    number: 7,
    name: 'Classic Business Room',
    type: 'Standard',
    price: 149,
    image: {
      publicId: 'classic-business-room-7',
      url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop',
    },
    description:
      'Professional and comfortable room designed for business travelers with modern amenities and work-friendly setup.',
    amenities: [
      'Free WiFi',
      'Work Desk',
      'Business Center Access',
      'Coffee Machine',
      'Iron & Board',
    ],
    size: 30,
    capacity: 2,
    category: 'Double',
    rating: 4.3,
    available: true,
  },
  {
    number: 8,
    name: 'Penthouse Suite',
    type: 'Luxury',
    price: 499,
    image: {
      publicId: 'penthouse-suite-8',
      url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
    },
    description:
      'Ultimate luxury experience with private terrace, panoramic views, and exclusive concierge service.',
    amenities: [
      'Free WiFi',
      'Private Terrace',
      'Concierge',
      'Mini Bar',
      'Jacuzzi',
      'Butler Service',
      'City View',
      'Champagne Service',
    ],
    size: 85,
    capacity: 6,
    category: 'Suite',
    rating: 4.9,
    available: false,
  },
]

async function uploadImageToS3(url: string, publicId: string) {
  try {
    console.log(`Downloading image for ${publicId}...`)
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data, 'binary')
    const contentType = response.headers['content-type'] || 'image/jpeg'

    const key = `hotel/rooms/${publicId}.jpg`

    console.log(`Uploading to S3: ${key}...`)
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL: 'public-read', // Uncomment if bucket is not public by default but you want public access
      })
    )

    const s3Url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    console.log(`✅ Uploaded: ${s3Url}`)
    return s3Url
  } catch (error) {
    console.error(`❌ Failed to upload image for ${publicId}:`, error)
    return url // Fallback to original URL
  }
}

;(async () => {
  try {
    await connectMongoDB()
    console.log('Seeding rooms...')
    
    // Clear existing rooms
    await Room.deleteMany({})

    // Process rooms with image uploads
    const roomsWithS3Images = await Promise.all(
      rooms.map(async (room) => {
        const s3Url = await uploadImageToS3(room.image.url, room.image.publicId)
        return {
          ...room,
          image: {
            ...room.image,
            url: s3Url,
          },
        }
      })
    )

    await Room.insertMany(roomsWithS3Images)
    console.log('✅ Rooms seeded successfully with S3 images')
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
