"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface Testimonial {
  name: string;
  role: string;
  image: string;
  testimonial: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Terje Hansen",
    role: "ELETRIKER, AB ELEKTRO",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
    testimonial:"Som eldre elektriker trodde jeg ikke jeg skulle finne noe bedre enn det jeg alltid har brukt. Men Eligent har gjort hverdagen min enklere, og jeg får bare positive kommentarer fra kundene på det visuelle."

,
  },
  {
    name: "Ali Hussain",
    role: "ELETRIKER, BESTE ELEKTRISE",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
        testimonial:"Vi hadde en stor boligutbygging hvor vi testet Eligent på halvparten av leilighetene. Forskjellen i installasjonstid var så tydelig at vi nå bruker det på alle prosjekter."
,

  },
  {
    name: "Per Brande",
    role: "ELETRIKER, PB ELEKTRO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        testimonial:"Designet gjør at kundene faktisk bryr seg om hvilke produkter vi installerer. Det har aldri skjedd før. Nå blir bryter og stikkontakter en del av samtalen om interiøret."
,

  },
  {
    name: "Nina Lykke",
    role: "ARKITEKT, MINIMAL ARKI",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
        testimonial:"Jeg hadde mine tvil om å gå bort fra merkevaren jeg har bygd virksomheten min på, men kvaliteten til Eligent er upåklagelig. Og installasjonen går overraskende raskt."
,

  },
  {
    name: "Erik Olsen",
    role: "ELETRIKER, AB ELEKTRO",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        testimonial:"Etter 15 år i bransjen er det ikke ofte jeg blir imponert over nye produkter. Men her har noen faktisk tenkt på oss som skal jobbe med det hver dag."
,

  },
  {
    name: "Maria Berg",
    role: "UTBYGGER, BERG BYGG",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
        testimonial:"Mine kunder spør nå aktivt etter 'de fine bryterne'. Det har skapt en helt ny dialog om kvalitet fremfor bare pris."
,

  },
];

// ========================================
// CONFIGURATION - Easy to adjust
// ========================================
const CONFIG = {
  ITEM_WIDTH: 280,
  MAX_HEIGHT: 500,
  MIN_HEIGHT: 300,
  GAP: 24,
  SCALE_TRANSITION_ZONE: 700, // Increased for wider transition (outer items bigger earlier)
  DRAG_MOMENTUM: 0.95, // Momentum decay (0-1, higher = more momentum)
};

export default function TestimonialSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPositionRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const targetScrollRef = useRef(0);
  const isAnimatingRef = useRef(false);

  // Drag state
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const velocityRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTimeRef = useRef(0);

  const [containerWidth, setContainerWidth] = useState(0);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  // Duplicate items for infinite scroll
  const duplicatedItems = [...testimonials, ...testimonials, ...testimonials];
  const totalItemWidth = CONFIG.ITEM_WIDTH + CONFIG.GAP;
  const singleSetWidth = totalItemWidth * testimonials.length;

  // Calculate offset to center the carousel
  const getCenterOffset = useCallback(() => {
    if (!containerRef.current) return 0;
    const containerW = containerRef.current.offsetWidth;
    // Offset so that the "current" item is centered
    return containerW / 2 - CONFIG.ITEM_WIDTH / 2;
  }, []);

  // Update item heights based on distance from center
  const updateItemEffects = useCallback(() => {
    if (!containerRef.current || !scrollContainerRef.current) return;

    const containerW = containerRef.current.offsetWidth;
    const centerX = containerW / 2;
    const offset = getCenterOffset();

    itemsRef.current.forEach((item, index) => {
      if (!item) return;

      // Calculate item's center position relative to container
      const itemLeft = offset + index * totalItemWidth - scrollPositionRef.current;
      const itemCenterX = itemLeft + CONFIG.ITEM_WIDTH / 2;

      // Distance from center
      const distanceFromCenter = Math.abs(itemCenterX - centerX);

      // Calculate height based on distance (smooth interpolation)
      const normalizedDistance = Math.min(
        distanceFromCenter / CONFIG.SCALE_TRANSITION_ZONE,
        1
      );

      // Smooth easing curve
      const easing = 1 - Math.pow(normalizedDistance, 1.5);
      const heightRange = CONFIG.MAX_HEIGHT - CONFIG.MIN_HEIGHT;
      const height = CONFIG.MIN_HEIGHT + heightRange * easing;

      // Apply height to image container
      const imageContainer = item.querySelector(".slide-image") as HTMLElement;
      if (imageContainer) {
        imageContainer.style.height = `${height}px`;
      }
    });

    // Find the center item and update active testimonial
    const centerIndex = Math.round(scrollPositionRef.current / totalItemWidth);
    const actualIndex = ((centerIndex % testimonials.length) + testimonials.length) % testimonials.length;
    setActiveTestimonialIndex(actualIndex);
  }, [totalItemWidth, getCenterOffset]);

  // Animation loop for smooth scrolling
  const animate = useCallback(() => {
    if (!scrollContainerRef.current) return;

    // Handle momentum from drag with snap to center
    if (!isDraggingRef.current && Math.abs(velocityRef.current) > 0.5) {
      scrollPositionRef.current += velocityRef.current;
      targetScrollRef.current = scrollPositionRef.current;
      velocityRef.current *= CONFIG.DRAG_MOMENTUM;

      // Stop momentum and snap when velocity is low
      if (Math.abs(velocityRef.current) < 0.5) {
        velocityRef.current = 0;
        // Snap to nearest item
        const nearestIndex = Math.round(scrollPositionRef.current / totalItemWidth);
        targetScrollRef.current = nearestIndex * totalItemWidth;
        isAnimatingRef.current = true;
      }
    }

    // Smooth animation to target (only for button navigation)
    if (isAnimatingRef.current && !isDraggingRef.current) {
      const diff = targetScrollRef.current - scrollPositionRef.current;
      const step = diff * 0.12;

      if (Math.abs(diff) < 0.5) {
        scrollPositionRef.current = targetScrollRef.current;
        isAnimatingRef.current = false;
      } else {
        scrollPositionRef.current += step;
      }
    }

    // Handle infinite loop reset
    if (scrollPositionRef.current >= singleSetWidth * 2) {
      scrollPositionRef.current -= singleSetWidth;
      targetScrollRef.current -= singleSetWidth;
    } else if (scrollPositionRef.current < singleSetWidth * 0.5) {
      scrollPositionRef.current += singleSetWidth;
      targetScrollRef.current += singleSetWidth;
    }

    // Apply scroll transform with centering offset
    const offset = getCenterOffset();
    scrollContainerRef.current.style.transform = `translateX(${offset - scrollPositionRef.current}px)`;

    // Update item effects
    updateItemEffects();

    animationRef.current = requestAnimationFrame(animate);
  }, [singleSetWidth, updateItemEffects, totalItemWidth, getCenterOffset]);

  // Drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartScrollRef.current = scrollPositionRef.current;
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = Date.now();
    velocityRef.current = 0;
    isAnimatingRef.current = false;
  }, []);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;

    const deltaX = dragStartXRef.current - clientX;
    scrollPositionRef.current = dragStartScrollRef.current + deltaX;
    targetScrollRef.current = scrollPositionRef.current;

    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastDragTimeRef.current;
    if (dt > 0) {
      velocityRef.current = (lastDragXRef.current - clientX) / dt * 16; // Normalize to ~60fps
    }
    lastDragXRef.current = clientX;
    lastDragTimeRef.current = now;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // If velocity is low, snap immediately
    if (Math.abs(velocityRef.current) < 2) {
      velocityRef.current = 0;
      const nearestIndex = Math.round(scrollPositionRef.current / totalItemWidth);
      targetScrollRef.current = nearestIndex * totalItemWidth;
      isAnimatingRef.current = true;
    }
    // Otherwise momentum will handle snapping
  }, [totalItemWidth]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Navigate to previous slide
  const handlePrev = useCallback(() => {
    velocityRef.current = 0;
    targetScrollRef.current -= totalItemWidth;
    isAnimatingRef.current = true;
  }, [totalItemWidth]);

  // Navigate to next slide
  const handleNext = useCallback(() => {
    velocityRef.current = 0;
    targetScrollRef.current += totalItemWidth;
    isAnimatingRef.current = true;
  }, [totalItemWidth]);

  // Initialize
  useEffect(() => {
    // Start in the middle set for infinite scroll buffer
    scrollPositionRef.current = singleSetWidth;
    targetScrollRef.current = singleSetWidth;

    // Start animation loop
    animate();

    // Add global mouse/touch listeners for drag
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [animate, singleSetWidth, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      updateItemEffects();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateItemEffects]);

  return (
    <section className="py-16 bg-zinc-50 overflow-hidden">
      {/* Header with title and navigation buttons */}
      <div className="px-8 mb-8 flex items-end justify-between">
        <h2 className="text-4xl font-normal text-emerald-800 max-w-3xl">
          Hør det fra elektrikkere, utbyggere og arkitekter som bruker eligent
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="w-12 h-12 flex items-center justify-center border border-zinc-300 rounded-full hover:bg-zinc-100 transition-colors"
            aria-label="Previous slide"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="w-12 h-12 flex items-center justify-center border border-zinc-300 rounded-full hover:bg-zinc-100 transition-colors"
            aria-label="Next slide"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>



      {/* Carousel container */}
      <div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{ height: CONFIG.MAX_HEIGHT + 100 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          ref={scrollContainerRef}
          className="flex absolute left-0 top-0"
          style={{
            gap: CONFIG.GAP,
            willChange: "transform",
          }}
        >
          {duplicatedItems.map((testimonial, index) => (
            <div
              key={index}
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              className="flex-shrink-0 pointer-events-none"
              style={{
                width: CONFIG.ITEM_WIDTH,
              }}
            >
              <div
                className="slide-image w-full bg-zinc-200 overflow-hidden transition-[height] duration-100 ease-out"
                style={{ height: CONFIG.MIN_HEIGHT }}
              >
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="mt-4">
                <span className="block text-xs uppercase tracking-wide text-zinc-500 mb-2">
                  {testimonial.role}
                </span>
                <h3 className="text-xl font-medium text-zinc-900">
                  {testimonial.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
            {/* Testimonial quote */}
      <div className="px-8 mb-8 min-h-[120px] flex justify-center">
        <blockquote className="text-3xl text-zinc-700 max-w-4xl italic transition-opacity duration-300 text-center">
          "{testimonials[activeTestimonialIndex].testimonial}"
        </blockquote>
      </div>
    </section>
  );
}
