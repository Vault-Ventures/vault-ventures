import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { resolveMediaUrl, API_BASE_URL, api } from '../services/api';
import Profile from '../pages/shared/Profile';
import { ToastProvider } from '../components/ui/Feedback';

const mockAuthState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: 'Sarah Khan',
    email: 'sarah@example.com',
    avatar_url: null as string | null,
    cover_photo_url: null as string | null,
    verification_tier: 1,
  },
  session: {
    roles: ['founder'],
    activeRole: 'founder',
    user: { id: 1, name: 'Sarah Khan' },
    isAdmin: false,
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

describe('Profile Photo URL Resolution and Media Handling', () => {
  it('returns null for empty, undefined, or null input', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });

  it('preserves absolute URLs including http, https, data and blob URLs', () => {
    expect(resolveMediaUrl('https://images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
    expect(resolveMediaUrl('http://example.com/avatar.png')).toBe('http://example.com/avatar.png');
    expect(resolveMediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
    expect(resolveMediaUrl('blob:http://localhost:8443/uuid-123')).toBe('blob:http://localhost:8443/uuid-123');
  });

  it('correctly resolves relative storage paths to the backend API base URL', () => {
    expect(resolveMediaUrl('/storage/avatars/user-1-avatar.jpg')).toBe(`${API_BASE_URL}/storage/avatars/user-1-avatar.jpg`);
    expect(resolveMediaUrl('storage/covers/user-1-cover.jpg')).toBe(`${API_BASE_URL}/storage/covers/user-1-cover.jpg`);
  });
});

describe('Profile Component Photo Display & Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuthState.user.avatar_url = null;
    mockAuthState.user.cover_photo_url = null;
  });

  const renderProfile = () => {
    return render(
      <MemoryRouter initialEntries={['/app/profile']}>
        <ToastProvider>
          <Profile />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders avatar image with resolved backend URL when avatar_url is provided', async () => {
    mockAuthState.user.avatar_url = '/storage/avatars/sarah-photo.jpg';
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

    renderProfile();

    const img = await screen.findByAltText('Profile');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe(`${API_BASE_URL}/storage/avatars/sarah-photo.jpg`);
  });

  it('falls back to initials when avatar_url is null', async () => {
    mockAuthState.user.avatar_url = null;
    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 1,
        name: 'Sarah Khan',
        email: 'sarah@example.com',
        headline: 'Tech Founder',
        bio: '',
        location: 'Dhaka, Bangladesh',
        avatar_url: null,
        cover_photo_url: null,
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

    renderProfile();

    expect(await screen.findByText('SK')).toBeDefined();
    expect(screen.queryByAltText('Profile')).toBeNull();
  });

  it('falls back to initials if avatar image fails to load (onError)', async () => {
    mockAuthState.user.avatar_url = '/storage/avatars/non-existent.jpg';
    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 1,
        name: 'Sarah Khan',
        email: 'sarah@example.com',
        headline: 'Founder & CEO',
        bio: '',
        location: 'Dhaka',
        avatar_url: '/storage/avatars/non-existent.jpg',
        cover_photo_url: null,
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

    renderProfile();

    const img = await screen.findByAltText('Profile');
    expect(img).toBeDefined();

    // Trigger image error
    fireEvent.error(img);

    // Initial fallback should now be visible
    await waitFor(() => {
      expect(screen.getByText('SK')).toBeDefined();
      expect(screen.queryByAltText('Profile')).toBeNull();
    });
  });

  it('handles avatar upload interaction and calls uploadAvatar API', async () => {
    vi.spyOn(api.profile, 'get').mockResolvedValue({
      user: {
        id: 1,
        name: 'Sarah Khan',
        email: 'sarah@example.com',
        headline: 'Tech Founder',
        bio: '',
        location: 'Dhaka',
        avatar_url: null,
        cover_photo_url: null,
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

    const uploadMock = vi.spyOn(api.profile, 'uploadAvatar').mockResolvedValue({
      avatar_url: '/storage/avatars/uploaded-photo.jpg',
    });

    renderProfile();

    const editBtn = await screen.findByTitle('Edit profile photo');
    expect(editBtn).toBeDefined();

    const fileInput = screen.getByLabelText('Upload photo');
    const fakeFile = new File(['image bytes'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(1);
    });
  });
});
