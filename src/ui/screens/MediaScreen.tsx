/**
 * Media Control Screen
 *
 * Multi-room audio, TV controls, and streaming
 * service management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Tv,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Speaker,
  Radio,
  Mic,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassSlider } from '../glass';

interface AudioZone {
  id: string;
  name: string;
  isPlaying: boolean;
  volume: number;
  source: string;
}

const demoZones: AudioZone[] = [
  { id: 'living', name: 'Living Room', isPlaying: true, volume: 65, source: 'Spotify' },
  { id: 'bedroom', name: 'Bedroom', isPlaying: false, volume: 30, source: 'Radio' },
  { id: 'kitchen', name: 'Kitchen', isPlaying: true, volume: 45, source: 'Spotify' },
  { id: 'office', name: 'Office', isPlaying: false, volume: 50, source: 'AirPlay' },
];

const nowPlaying = {
  title: 'Midnight City',
  artist: 'M83',
  album: 'Hurry Up, We\'re Dreaming',
  duration: 243,
  elapsed: 87,
};

export const MediaScreen: React.FC = () => {
  const [zones, setZones] = useState(demoZones);
  const [selectedZone, setSelectedZone] = useState('living');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const selectedAudioZone = zones.find(z => z.id === selectedZone)!;

  const updateZoneVolume = (id: string, volume: number) => {
    setZones(prev =>
      prev.map(z => (z.id === id ? { ...z, volume } : z))
    );
  };

  const toggleZonePlay = (id: string) => {
    setZones(prev =>
      prev.map(z => (z.id === id ? { ...z, isPlaying: !z.isPlaying } : z))
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Now Playing */}
      <GlassCard variant="elevated" size="lg" className="relative overflow-hidden">
        {/* Background blur effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start gap-6 mb-8">
            {/* Album Art */}
            <motion.div
              className="w-32 h-32 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                boxShadow: '0 8px 32px rgba(167, 139, 250, 0.3)',
              }}
              animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Music size={48} className="text-white" />
            </motion.div>

            {/* Track Info */}
            <div className="flex-1">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Now Playing</p>
              <h2 className="text-2xl font-semibold text-white mb-1">{nowPlaying.title}</h2>
              <p className="text-white/70">{nowPlaying.artist}</p>
              <p className="text-sm text-white/50">{nowPlaying.album}</p>

              {/* Source Badge */}
              <div className="mt-4 flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-success-green/15 text-success-green text-xs">
                  {selectedAudioZone.source}
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                  {selectedAudioZone.name}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                initial={{ width: 0 }}
                animate={{ width: `${(nowPlaying.elapsed / nowPlaying.duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-white/50">{formatTime(nowPlaying.elapsed)}</span>
              <span className="text-xs text-white/50">{formatTime(nowPlaying.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <motion.button
              className={`p-3 rounded-full ${isShuffle ? 'bg-white/10' : ''}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsShuffle(!isShuffle)}
            >
              <Shuffle size={20} className={isShuffle ? 'text-purple-400' : 'text-white/50'} />
            </motion.button>

            <motion.button
              className="p-3 rounded-full"
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack size={24} className="text-white" />
            </motion.button>

            <motion.button
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                boxShadow: '0 4px 20px rgba(167, 139, 250, 0.4)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause size={28} className="text-white" />
              ) : (
                <Play size={28} className="text-white ml-1" />
              )}
            </motion.button>

            <motion.button
              className="p-3 rounded-full"
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward size={24} className="text-white" />
            </motion.button>

            <motion.button
              className={`p-3 rounded-full ${repeatMode !== 'off' ? 'bg-white/10' : ''}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')}
            >
              <Repeat
                size={20}
                className={repeatMode !== 'off' ? 'text-purple-400' : 'text-white/50'}
              />
              {repeatMode === 'one' && (
                <span className="absolute text-[8px] text-purple-400 font-bold">1</span>
              )}
            </motion.button>
          </div>
        </div>
      </GlassCard>

      {/* Volume Control */}
      <GlassCard variant="default" size="md">
        <div className="flex items-center gap-4 mb-4">
          <Volume2 size={24} className="text-white/50" />
          <div className="flex-1">
            <h3 className="text-white font-medium">Master Volume</h3>
            <p className="text-xs text-white/50">{selectedAudioZone.name}</p>
          </div>
          <span className="text-lg font-semibold text-white">{selectedAudioZone.volume}%</span>
        </div>
        <GlassSlider
          value={selectedAudioZone.volume}
          onChange={(v) => updateZoneVolume(selectedZone, v)}
          variant="gradient"
        />
      </GlassCard>

      {/* Audio Zones */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Audio Zones</h3>
        <div className="grid grid-cols-2 gap-4">
          {zones.map(zone => (
            <motion.div
              key={zone.id}
              className={`p-4 rounded-xl cursor-pointer ${
                selectedZone === zone.id ? 'ring-2 ring-purple-400' : ''
              }`}
              style={{
                background: zone.isPlaying
                  ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(244, 114, 182, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedZone(zone.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <Speaker
                  size={20}
                  className={zone.isPlaying ? 'text-purple-400' : 'text-white/30'}
                />
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: zone.isPlaying ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleZonePlay(zone.id);
                  }}
                >
                  {zone.isPlaying ? (
                    <Pause size={14} className="text-purple-400" />
                  ) : (
                    <Play size={14} className="text-white/50 ml-0.5" />
                  )}
                </motion.button>
              </div>
              <p className="text-sm font-medium text-white">{zone.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/50">{zone.source}</span>
                <div className="flex items-center gap-1">
                  <Volume2 size={12} className="text-white/40" />
                  <span className="text-xs text-white/50">{zone.volume}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaScreen;
