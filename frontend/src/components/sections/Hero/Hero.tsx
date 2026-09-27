import * as React from 'react'
import Autoplay from 'embla-carousel-autoplay'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import HeroContent from '../../layout/Hero/HeroContent'
import RoomBookingSearch from '../../layout/Hero/RoomBookingSearch'
import ScrollIndicator from '../../layout/Hero/ScrollIndicator'

const Hero = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false })
  )

  // Enhanced collection of luxury hotel background images
  const backgroundImages = [
    {
      url: '/images/Hero1.avif',
      title: 'Luxury Lobby',
    },
    {
      url: '/images/Hero3.avif',
      title: 'Infinity Pool',
    },
    {
      url: '/images/Hero4.avif',
      title: 'Royal Suite',
    },
    {
      url: '/images/Hero5.avif',
      title: 'Fine Dining',
    },
    {
      url: '/images/Hero6.avif',
      title: 'Grand Exterior',
    },
  ]

  return (
    <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Background Carousel with Ken Burns Effect */}
      <Carousel
        plugins={[plugin.current]}
        className="absolute inset-0 w-full h-full"
        opts={{
          align: 'start',
          loop: true,
          duration: 60, 
        }}
      >
        <CarouselContent className="h-full -ml-0">
          {backgroundImages.map((image, index) => (
            <CarouselItem key={index} className="pl-0 basis-full">
              <div className="relative h-screen w-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-ken-burns"
                  style={{
                    backgroundImage: `url('${image.url}')`,
                  }}
                />
                {/* Advanced Overlay System */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
                <div className="absolute inset-0 bg-black/20" /> {/* General dim */}
                
                {/* Image title overlay */}
                <div className="absolute bottom-8 right-8 z-10 hidden md:block">
                  <div className="flex items-center gap-3">
                    <span className="h-[1px] w-12 bg-white/50"></span>
                    <span className="text-white/80 text-sm font-medium tracking-widest uppercase">
                      {image.title}
                    </span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Content Container */}
      <div className="relative z-30 flex flex-col justify-center items-center h-full px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto pt-16 lg:pt-0">
        <div className="flex-shrink-0 mb-4 lg:mb-8">
           <HeroContent />
        </div>
        
        <div className="w-full max-w-6xl pb-8 lg:pb-12">
           <RoomBookingSearch />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 hidden lg:block animate-bounce opacity-70">
        <ScrollIndicator />
      </div>

      {/* Atmospheric Effects */}
      <div className="absolute inset-0 z-20 pointer-events-none">
         {/* Particles */}
         <div className="absolute inset-0 overflow-hidden opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-200 rounded-full animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                opacity: Math.random() * 0.5 + 0.3
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
