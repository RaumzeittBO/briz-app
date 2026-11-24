import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  emptyLabel: string;
  previousLabel: string;
  nextLabel: string;
  showImageLabel: (index: number) => string;
  thumbnailsLabel: string;
}

export function ProductImageGallery({ images, productName, emptyLabel, previousLabel, nextLabel, showImageLabel, thumbnailsLabel }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const visibleIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const activeImage = images[visibleIndex];

  const showPrevious = () => setActiveIndex(visibleIndex === 0 ? images.length - 1 : visibleIndex - 1);
  const showNext = () => setActiveIndex((visibleIndex + 1) % images.length);

  return (
    <div className="space-y-3">
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-white"
        onTouchStart={event => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={event => {
          if (touchStartX.current === null || images.length < 2) return;
          const touchEndX = event.changedTouches[0]?.clientX;
          if (typeof touchEndX !== 'number') return;
          const delta = touchEndX - touchStartX.current;
          if (delta > 40) showPrevious();
          else if (delta < -40) showNext();
          touchStartX.current = null;
        }}
      >
        {activeImage ? (
          <img src={activeImage} alt={`${productName} ${activeIndex + 1}`} className="h-full w-full select-none object-contain p-3" draggable={false} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-50 text-stone-400">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
            <span className="text-sm">{emptyLabel}</span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <Button type="button" variant="secondary" size="icon" aria-label={previousLabel} onClick={showPrevious} className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 shadow">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button type="button" variant="secondary" size="icon" aria-label={nextLabel} onClick={showNext} className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 shadow">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2 py-1">
              {images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" aria-label={showImageLabel(index + 1)} aria-pressed={index === visibleIndex} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full transition-all ${index === visibleIndex ? 'w-5 bg-brand-yellow' : 'w-2 bg-stone-300'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label={thumbnailsLabel}>
          {images.map((image, index) => (
            <button key={`thumb-${image}-${index}`} type="button" aria-label={showImageLabel(index + 1)} aria-pressed={index === visibleIndex} onClick={() => setActiveIndex(index)} className={`h-14 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${index === visibleIndex ? 'border-brand-yellow' : 'border-stone-200'}`}>
              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
