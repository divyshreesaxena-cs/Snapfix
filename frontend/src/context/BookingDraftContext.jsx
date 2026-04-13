import React, { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'bookingDraftMeta';

const BookingDraftContext = createContext(null);

const getStoredMeta = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const BookingDraftProvider = ({ children }) => {
  const [draft, setDraftState] = useState(() => getStoredMeta() || {});
  const [images, setImages] = useState([]);

  const persistMeta = (nextDraft) => {
    const serializableDraft = {
      ...nextDraft,
      imagesCount: Array.isArray(nextDraft.images) ? nextDraft.images.length : undefined,
    };
    delete serializableDraft.images;
    setDraftState(nextDraft);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializableDraft));
  };

  const updateDraft = (nextDraft) => {
    const merged = { ...draft, ...nextDraft };
    persistMeta(merged);
    if (Array.isArray(nextDraft.images)) {
      setImages(nextDraft.images);
    }
  };

  const setWorkerId = (workerId) => {
    persistMeta({ ...draft, workerId });
  };

  const clearDraft = () => {
    setDraftState({});
    setImages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({
    draft,
    images,
    hasImagesInMemory: images.length > 0,
    updateDraft,
    setWorkerId,
    clearDraft,
  }), [draft, images]);

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
};

export const useBookingDraft = () => {
  const context = useContext(BookingDraftContext);
  if (!context) {
    throw new Error('useBookingDraft must be used within BookingDraftProvider');
  }
  return context;
};
