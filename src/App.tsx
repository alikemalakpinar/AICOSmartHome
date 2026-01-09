/**
 * AICO Smart Home - Main Application
 *
 * Ultra-luxury wall-mounted home intelligence system.
 */

import React, { useEffect, useState } from 'react';
import { DigitalTwin, useSceneStore } from './3d';
import { useContextStore, startContextTimeUpdater, startIdleTimeTracker } from './ui/context';
import { demoResidence } from './data/demo-residence';
import type { DeviceId, RoomId, FloorId } from './types/core';

// ============================================================================
// Main App Component
// ============================================================================

export const App: React.FC = () => {
  const { theme, layout, context, transitionInProgress } = useContextStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Start context trackers
    const stopTimeUpdater = startContextTimeUpdater();
    const stopIdleTracker = startIdleTimeTracker();

    // Initialize system
    initializeSystem().then(() => {
      setInitialized(true);
    });

    return () => {
      stopTimeUpdater();
      stopIdleTracker();
    };
  }, []);

  const handleDeviceClick = (deviceId: DeviceId) => {
    console.log('Device clicked:', deviceId);
    // Open device control panel
  };

  const handleRoomClick = (roomId: RoomId) => {
    console.log('Room clicked:', roomId);
    // Navigate to room view
  };

  const handleFloorClick = (floorId: FloorId) => {
    console.log('Floor clicked:', floorId);
    // Focus on floor
  };

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <div
      className="aico-app"
      style={{
        '--color-primary': theme.colors.primary,
        '--color-background': theme.colors.background,
        '--color-surface': theme.colors.surface,
        '--color-text': theme.colors.textPrimary,
        '--color-text-secondary': theme.colors.textSecondary,
        '--font-family': theme.typography.fontFamily,
        '--transition-duration': `${theme.animation.duration.normal}ms`,
      } as React.CSSProperties}
    >
      <div className={`app-container ${transitionInProgress ? 'transitioning' : ''}`}>
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <TimeDisplay />
            <WeatherDisplay />
          </div>
          <div className="header-center">
            <Logo />
          </div>
          <div className="header-right">
            <UserStatus user={context.user} />
            <ResidenceMode mode={context.residence.mode} />
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          <div className="digital-twin-container">
            <DigitalTwin
              onDeviceClick={handleDeviceClick}
              onRoomClick={handleRoomClick}
              onFloorClick={handleFloorClick}
            />
          </div>

          {/* Sidebar */}
          <aside className="app-sidebar">
            <QuickScenes />
            <ClimateSummary />
            <RecentActivity />
          </aside>
        </main>

        {/* Footer / Navigation */}
        <footer className="app-footer">
          <Navigation />
        </footer>
      </div>

      {/* Overlays */}
      <AlertOverlay />
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-logo">
        <svg viewBox="0 0 100 100" className="logo-svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 30 50 L 50 30 L 70 50 L 50 70 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="loading-text">AICO</div>
      <div className="loading-spinner" />
    </div>
  </div>
);

const Logo: React.FC = () => (
  <div className="logo">
    <span className="logo-text">AICO</span>
  </div>
);

const TimeDisplay: React.FC = () => {
  const { context } = useContextStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="time-display">
      <span className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="date">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
    </div>
  );
};

const WeatherDisplay: React.FC = () => {
  const { context } = useContextStore();

  return (
    <div className="weather-display">
      <span className="temperature">{context.weather.temperature}°</span>
      <span className="condition">{context.weather.condition}</span>
    </div>
  );
};

const UserStatus: React.FC<{ user: typeof useContextStore extends () => infer S ? S extends { context: { user: infer U } } ? U : null : null }> = ({ user }) => {
  if (!user) {
    return (
      <div className="user-status guest">
        <span className="user-icon">👤</span>
        <span className="user-name">Guest</span>
      </div>
    );
  }

  return (
    <div className="user-status identified">
      <span className="user-icon">✓</span>
      <span className="user-name">{user.name}</span>
    </div>
  );
};

const ResidenceMode: React.FC<{ mode: string }> = ({ mode }) => {
  const modeLabels: Record<string, string> = {
    home: 'Home',
    away: 'Away',
    night: 'Night',
    vacation: 'Vacation',
    guest: 'Guest',
    party: 'Party',
    cinema: 'Cinema',
    emergency: 'Emergency',
    lockdown: 'Lockdown',
  };

  return (
    <div className={`residence-mode mode-${mode}`}>
      <span className="mode-label">{modeLabels[mode] || mode}</span>
    </div>
  );
};

const QuickScenes: React.FC = () => {
  const scenes = [
    { id: 'morning', name: 'Morning', icon: '🌅' },
    { id: 'relax', name: 'Relax', icon: '🛋️' },
    { id: 'movie', name: 'Movie', icon: '🎬' },
    { id: 'sleep', name: 'Sleep', icon: '🌙' },
  ];

  return (
    <div className="quick-scenes">
      <h3>Quick Scenes</h3>
      <div className="scenes-grid">
        {scenes.map(scene => (
          <button key={scene.id} className="scene-button">
            <span className="scene-icon">{scene.icon}</span>
            <span className="scene-name">{scene.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ClimateSummary: React.FC = () => {
  return (
    <div className="climate-summary">
      <h3>Climate</h3>
      <div className="climate-stats">
        <div className="stat">
          <span className="stat-label">Inside</span>
          <span className="stat-value">22°C</span>
        </div>
        <div className="stat">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">45%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Air Quality</span>
          <span className="stat-value good">Good</span>
        </div>
      </div>
    </div>
  );
};

const RecentActivity: React.FC = () => {
  const activities = [
    { time: '2 min ago', text: 'Front door unlocked' },
    { time: '15 min ago', text: 'Living room lights adjusted' },
    { time: '1 hour ago', text: 'HVAC switched to cooling' },
  ];

  return (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      <ul className="activity-list">
        {activities.map((activity, index) => (
          <li key={index} className="activity-item">
            <span className="activity-time">{activity.time}</span>
            <span className="activity-text">{activity.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Navigation: React.FC = () => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'climate', label: 'Climate', icon: '🌡️' },
    { id: 'lighting', label: 'Lighting', icon: '💡' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'energy', label: 'Energy', icon: '⚡' },
    { id: 'media', label: 'Media', icon: '🎵' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const [active, setActive] = useState('home');

  return (
    <nav className="main-navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          onClick={() => setActive(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const AlertOverlay: React.FC = () => {
  // In production, this would show security alerts, notifications, etc.
  return null;
};

// ============================================================================
// Initialization
// ============================================================================

async function initializeSystem(): Promise<void> {
  // Initialize bridge manager
  // Initialize biometric manager
  // Load residence data
  // Connect to devices
  console.log('AICO Smart Home System initializing...');

  // Simulate initialization delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Load demo residence into scene
  const { loadScene } = useSceneStore.getState();
  loadScene(demoResidence);

  console.log('System initialized with demo residence:', demoResidence.name);
}

export default App;
