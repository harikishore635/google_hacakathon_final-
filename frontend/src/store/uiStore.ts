import { create } from 'zustand';

export type CurrentView = 'dashboard' | 'fieldmind' | 'needpulse' | 'crisisgrid' | 'karmadao' | 'ledger';

interface Notification {
  id: string;
  type: 'incident' | 'volunteer' | 'fund' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface UIState {
  currentView: CurrentView;
  setCurrentView: (view: CurrentView) => void;
  systemTime: string;
  setSystemTime: (time: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  toggleDarkModeWithRipple: (buttonRect?: DOMRect) => void;
  initTheme: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Settings Panel
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Notifications
  notifications: Notification[];
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'incident', title: 'New incident reported', body: 'Flooding in Chennai Zone 4', time: '2 min ago', read: false },
  { id: 'n2', type: 'volunteer', title: 'Volunteer check-in', body: '47 volunteers confirmed for Zone 2', time: '15 min ago', read: false },
  { id: 'n3', type: 'fund', title: 'Fund transfer complete', body: '₹4,20,000 released to Tamil Nadu team', time: '1 hr ago', read: true },
  { id: 'n4', type: 'incident', title: 'Incident resolved', body: 'Landslide Zone 7 marked clear', time: '3 hr ago', read: true },
  { id: 'n5', type: 'system', title: 'System update', body: 'Resource allocation model updated', time: '1 day ago', read: true },
];

export const useUIStore = create<UIState>((set, get) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  systemTime: '--:--:-- IST',
  setSystemTime: (time) => set({ systemTime: time }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Theme
  darkMode: false,
  toggleDarkMode: () => {
    // Simple toggle (called from ripple completion or as fallback)
    const next = !get().darkMode;
    set({ darkMode: next });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      localStorage.setItem('nexseva_theme', next ? 'dark' : 'light');
    }
  },
  toggleDarkModeWithRipple: (buttonRect?: DOMRect) => {
    if (typeof document === 'undefined') return;
    const isDark = get().darkMode;
    const next = !isDark;
    const nextTheme = next ? 'dark' : 'light';

    // Get button center coordinates for ripple origin
    const originX = buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2;
    const originY = buttonRect ? buttonRect.top + buttonRect.height / 2 : window.innerHeight / 2;

    // Calculate maximum radius to cover entire viewport
    const maxRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    ) * 1.1;

    // Create expanding circle overlay with the NEW theme's bg
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple-overlay';
    ripple.style.cssText = `
      left: ${originX}px;
      top: ${originY}px;
      width: 0; height: 0;
      background: ${next ? '#0A0A0A' : '#FAFAF8'};
      transform: translate(-50%, -50%) scale(0);
    `;
    document.body.appendChild(ripple);

    // Force reflow
    ripple.offsetHeight;

    // Expand ripple
    ripple.style.transition = 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)';
    ripple.style.width = maxRadius * 2 + 'px';
    ripple.style.height = maxRadius * 2 + 'px';
    ripple.style.transform = 'translate(-50%, -50%) scale(1)';

    // At halfway point (275ms), switch theme — components repaint instantly
    setTimeout(() => {
      set({ darkMode: next });
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('nexseva_theme', nextTheme);
    }, 275);

    // Fade out ripple (don't reverse-shrink — just dissolve)
    setTimeout(() => {
      ripple.style.transition = 'opacity 0.25s ease';
      ripple.style.opacity = '0';
      setTimeout(() => ripple.remove(), 250);
    }, 500);
  },
  initTheme: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('nexseva_theme');
    const isDark = saved === 'dark';
    set({ darkMode: isDark });
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  },

  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Settings
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // Notifications
  notifications: DEFAULT_NOTIFICATIONS,
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
  })),
  unreadCount: () => get().notifications.filter(n => !n.read).length,
}));
