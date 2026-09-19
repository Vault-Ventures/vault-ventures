import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PhotoDetails {
  src: string;
  alt?: string;
  title?: string;
}

export interface PhotoViewerContextType {
  isOpen: boolean;
  currentPhoto: PhotoDetails | null;
  openPhoto: (photo: PhotoDetails) => void;
  closePhoto: () => void;
}

const PhotoViewerContext = createContext<PhotoViewerContextType | null>(null);

export function usePhotoViewer(): PhotoViewerContextType {
  const context = useContext(PhotoViewerContext);
  if (!context) {
    return {
      isOpen: false,
      currentPhoto: null,
      openPhoto: () => {},
      closePhoto: () => {},
    };
  }
  return context;
}

export function PhotoViewerModal({
  photo,
  onClose,
}: {
  photo: PhotoDetails | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!photo) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      data-testid="photo-viewer-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 select-none animate-in fade-in duration-200"
    >
      {/* Dimmed backdrop */}
      <div
        data-testid="photo-viewer-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity cursor-pointer"
      />

      {/* Close button */}
      <button
        type="button"
        data-testid="photo-viewer-close"
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C67A4E]"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Main container & image */}
      <div
        className="relative z-10 max-w-full max-h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center">
          <img
            data-testid="photo-viewer-image"
            src={photo.src}
            alt={photo.alt || photo.title || 'Enlarged photo'}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>

        {(photo.title || photo.alt) && (
          <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/90 text-[12.5px] font-medium backdrop-blur-md max-w-[85vw] truncate text-center shadow-lg">
            {photo.title || photo.alt}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoViewerProvider({ children }: { children: React.ReactNode }) {
  const [currentPhoto, setCurrentPhoto] = useState<PhotoDetails | null>(null);

  const openPhoto = useCallback((photo: PhotoDetails) => {
    if (!photo || !photo.src) return;
    setCurrentPhoto(photo);
  }, []);

  const closePhoto = useCallback(() => {
    setCurrentPhoto(null);
  }, []);

  return (
    <PhotoViewerContext.Provider
      value={{
        isOpen: Boolean(currentPhoto),
        currentPhoto,
        openPhoto,
        closePhoto,
      }}
    >
      {children}
      <PhotoViewerModal photo={currentPhoto} onClose={closePhoto} />
    </PhotoViewerContext.Provider>
  );
}
