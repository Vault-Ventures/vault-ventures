import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PhotoViewerProvider, usePhotoViewer } from '../context/PhotoViewerContext';
import Profile from '../pages/shared/Profile';
import BusinessProfile from '../pages/founder/BusinessProfile';
import { ToastProvider } from '../components/ui/Feedback';
import { api, resolveMediaUrl, API_BASE_URL } from '../services/api';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: 'Sarah Khan',
    email: 'sarah@example.com',
    avatar_url: '/storage/avatars/sarah-photo.jpg' as string | null,
    cover_photo_url: '/storage/covers/sarah-cover.jpg' as string | null,
    verification_tier: 1,
  },
  session: {
    roles: ['founder'],
    activeRole: 'founder',
    user: { id: 1, name: 'Sarah Khan' },
    isAdmin: false,
    status: 'authenticated',
  },
  refreshUser: vi.fn(),
}));

vi.mock('../components/layout/AppShell', () => ({
  useRole: () => ({ role: 'founder', setRole: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthState.user,
    session: mockAuthState.session,
    isAdmin: false,
    refreshUser: mockAuthState.refreshUser,
  }),
}));

function TestConsumer() {
  const { openPhoto, closePhoto, isOpen, currentPhoto } = usePhotoViewer();
  return (
    <div>
      <span data-testid="is-open">{isOpen ? 'true' : 'false'}</span>
      <span data-testid="photo-src">{currentPhoto?.src || ''}</span>
      <button
        type="button"
        data-testid="open-btn"
        onClick={() => openPhoto({ src: 'https://images.unsplash.com/sample.jpg', alt: 'Sample Alt', title: 'Sample Title' })}
      >
        Open
      </button>
      <button type="button" data-testid="close-btn" onClick={closePhoto}>
        Close
      </button>
    </div>
  );
}

describe('PhotoViewer Context & Modal Component Behavior', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens and displays the enlarged image with correct attributes', async () => {
    render(
      <PhotoViewerProvider>
        <TestConsumer />
      </PhotoViewerProvider>
    );

    expect(await screen.findByTestId('is-open')).toBeTruthy();
    expect(screen.getByTestId('is-open').textContent).toBe('false');
    expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();

    fireEvent.click(screen.getByTestId('open-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('is-open').textContent).toBe('true');
    });

    const modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();

    const img = screen.getByTestId('photo-viewer-image') as HTMLImageElement;
    expect(img.src).toBe('https://images.unsplash.com/sample.jpg');
    expect(img.alt).toBe('Sample Alt');

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes when clicking close button and restores scrolling', async () => {
    render(
      <PhotoViewerProvider>
        <TestConsumer />
      </PhotoViewerProvider>
    );

    fireEvent.click(await screen.findByTestId('open-btn'));
    const modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();

    const closeBtn = screen.getByTestId('photo-viewer-close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();
      expect(screen.getByTestId('is-open').textContent).toBe('false');
    });
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when clicking the dimmed backdrop', async () => {
    render(
      <PhotoViewerProvider>
        <TestConsumer />
      </PhotoViewerProvider>
    );

    fireEvent.click(await screen.findByTestId('open-btn'));
    await screen.findByTestId('photo-viewer-modal');

    const backdrop = screen.getByTestId('photo-viewer-backdrop');
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();
    });
  });

  it('closes when pressing the Escape key', async () => {
    render(
      <PhotoViewerProvider>
        <TestConsumer />
      </PhotoViewerProvider>
    );

    fireEvent.click(await screen.findByTestId('open-btn'));
    await screen.findByTestId('photo-viewer-modal');

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();
    });
  });

  it('does NOT close when clicking directly inside the image', async () => {
    render(
      <PhotoViewerProvider>
        <TestConsumer />
      </PhotoViewerProvider>
    );

    fireEvent.click(await screen.findByTestId('open-btn'));
    await screen.findByTestId('photo-viewer-modal');

    const img = screen.getByTestId('photo-viewer-image');
    fireEvent.click(img);

    expect(screen.getByTestId('photo-viewer-modal')).toBeTruthy();
  });
});

describe('PhotoViewer Integration with Profile Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuthState.user.avatar_url = '/storage/avatars/sarah-photo.jpg';
    mockAuthState.user.cover_photo_url = '/storage/covers/sarah-cover.jpg';
    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 1,
        name: 'Sarah Khan',
        email: 'sarah@example.com',
        headline: 'Tech Founder',
        bio: 'Building early-stage ventures',
        location: 'Dhaka, Bangladesh',
        avatar_url: '/storage/avatars/sarah-photo.jpg',
        cover_photo_url: '/storage/covers/sarah-cover.jpg',
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['founder'],
      profiles: {
        founder: { id: 1 },
        investor: null,
        professional: null,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('opens enlarged avatar when avatar button is clicked on Profile', async () => {
    render(
      <PhotoViewerProvider>
        <MemoryRouter initialEntries={['/app/profile']}>
          <ToastProvider>
            <Profile />
          </ToastProvider>
        </MemoryRouter>
      </PhotoViewerProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Khan')).toBeTruthy();
    });

    const avatarBtn = await screen.findByLabelText('View profile photo');
    fireEvent.click(avatarBtn);

    const modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();
    const enlargedImg = screen.getByTestId('photo-viewer-image') as HTMLImageElement;
    expect(enlargedImg.src).toBe(resolveMediaUrl('/storage/avatars/sarah-photo.jpg'));
  });

  it('opens enlarged cover photo when cover photo button is clicked on Profile', async () => {
    render(
      <PhotoViewerProvider>
        <MemoryRouter initialEntries={['/app/profile']}>
          <ToastProvider>
            <Profile />
          </ToastProvider>
        </MemoryRouter>
      </PhotoViewerProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Khan')).toBeTruthy();
    });

    const coverBtn = await screen.findByLabelText('View cover photo');
    fireEvent.click(coverBtn);

    const modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();
    const enlargedImg = screen.getByTestId('photo-viewer-image') as HTMLImageElement;
    expect(enlargedImg.src).toBe(resolveMediaUrl('/storage/covers/sarah-cover.jpg'));
  });

  it('does not make initials fallback clickable as photo viewer when avatar is missing', async () => {
    mockAuthState.user.avatar_url = null;
    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 1,
        name: 'Sarah Khan',
        email: 'sarah@example.com',
        avatar_url: null,
        cover_photo_url: null,
        experience: [],
        portfolio: [],
        preferences: {},
      },
      roles: ['founder'],
      profiles: { founder: { id: 1 }, investor: null, professional: null },
    });

    render(
      <PhotoViewerProvider>
        <MemoryRouter initialEntries={['/app/profile']}>
          <ToastProvider>
            <Profile />
          </ToastProvider>
        </MemoryRouter>
      </PhotoViewerProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('SK')).toBeTruthy();
    });

    expect(screen.queryByLabelText('View profile photo')).toBeNull();
    expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();
  });
});

describe('PhotoViewer Integration with BusinessProfile Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api.businesses, 'list').mockResolvedValue([
      {
        id: 10,
        name: 'Tech Ventures Ltd',
        status: 'published',
        cover_photo_url: '/storage/business-covers/biz-cover.jpg',
        logo_url: '/storage/business-logos/biz-logo.jpg',
      },
    ]);
    vi.spyOn(api.businesses, 'get').mockResolvedValue({
      id: 10,
      name: 'Tech Ventures Ltd',
      status: 'published',
      cover_photo_url: '/storage/business-covers/biz-cover.jpg',
      logo_url: '/storage/business-logos/biz-logo.jpg',
      industry: 'FinTech',
      business_stage: 'Seed',
      metrics: {},
      roles: [],
      documents: [],
    });
    vi.spyOn(api.readiness, 'getLatestAssessment').mockResolvedValue(null as any);
    vi.spyOn(api.businesses, 'getLatestAnalysis').mockResolvedValue(null as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('opens enlarged business logo and cover photo on BusinessProfile', async () => {
    render(
      <PhotoViewerProvider>
        <MemoryRouter initialEntries={['/app/founder/business/10']}>
          <ToastProvider>
            <Routes>
              <Route path="/app/founder/business/:id" element={<BusinessProfile />} />
            </Routes>
          </ToastProvider>
        </MemoryRouter>
      </PhotoViewerProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tech Ventures Ltd')).toBeTruthy();
    });

    const coverBtn = await screen.findByLabelText('View Tech Ventures Ltd cover photo');
    fireEvent.click(coverBtn);

    let modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();
    let img = screen.getByTestId('photo-viewer-image') as HTMLImageElement;
    expect(img.src).toBe(resolveMediaUrl('/storage/business-covers/biz-cover.jpg'));

    // Close it
    fireEvent.click(screen.getByTestId('photo-viewer-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('photo-viewer-modal')).toBeNull();
    });

    // Now click business logo
    const logoBtn = await screen.findByLabelText('View Tech Ventures Ltd logo');
    fireEvent.click(logoBtn);

    modal = await screen.findByTestId('photo-viewer-modal');
    expect(modal).toBeTruthy();
    img = screen.getByTestId('photo-viewer-image') as HTMLImageElement;
    expect(img.src).toBe(resolveMediaUrl('/storage/business-logos/biz-logo.jpg'));
  });
});
