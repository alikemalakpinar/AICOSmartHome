/**
 * Media Control Screen
 *
 * Harmony and audio zone management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Volume2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Sofa,
  Bed,
  UtensilsCrossed,
  Laptop,
} from 'lucide-react';

interface AudioZone {
  id: string;
  name: string;
  icon: typeof Sofa;
  isPlaying: boolean;
  volume: number;
  source: string;
}

const demoZones: AudioZone[] = [
  { id: 'living', name: 'Living Room', icon: Sofa, isPlaying: true, volume: 65, source: 'Spotify' },
  { id: 'bedroom', name: 'Bedroom', icon: Bed, isPlaying: false, volume: 30, source: 'Radio' },
  { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed, isPlaying: true, volume: 45, source: 'Spotify' },
  { id: 'office', name: 'Office', icon: Laptop, isPlaying: false, volume: 50, source: 'AirPlay' },
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Harmony</h1>
            <p className="text-slate-500 text-sm mt-0.5">Audio orchestration</p>
          </div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-100">
            <Music size={12} className="mr-1.5" />
            {zones.filter(z => z.isPlaying).length} zones active
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-3xl mx-auto">
          {/* Now Playing */}
          <motion.div
            className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 shadow-lg relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10">
              <div className="flex items-start gap-5 mb-6">
                <motion.div
                  className="w-28 h-28 rounded-xl flex items-center justify-center bg-white/20 shadow-lg"
                  animate={isPlaying ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Music size={40} className="text-white" />
                </motion.div>

                <div className="flex-1 pt-2">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Now Playing</p>
                  <h2 className="text-2xl font-semibold text-white mb-1">{nowPlaying.title}</h2>
                  <p className="text-white/80">{nowPlaying.artist}</p>
                  <p className="text-sm text-white/50">{nowPlaying.album}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(nowPlaying.elapsed / nowPlaying.duration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-white/60">{formatTime(nowPlaying.elapsed)}</span>
                  <span className="text-xs text-white/60">{formatTime(nowPlaying.duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <motion.button
                  className={`p-2.5 rounded-full ${isShuffle ? 'bg-white/20' : ''}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsShuffle(!isShuffle)}
                >
                  <Shuffle size={18} className={isShuffle ? 'text-white' : 'text-white/50'} />
                </motion.button>

                <motion.button className="p-2.5 rounded-full" whileTap={{ scale: 0.9 }}>
                  <SkipBack size={22} className="text-white" />
                </motion.button>

                <motion.button
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause size={24} className="text-violet-600" />
                  ) : (
                    <Play size={24} className="text-violet-600 ml-1" />
                  )}
                </motion.button>

                <motion.button className="p-2.5 rounded-full" whileTap={{ scale: 0.9 }}>
                  <SkipForward size={22} className="text-white" />
                </motion.button>

                <motion.button
                  className={`p-2.5 rounded-full relative ${repeatMode !== 'off' ? 'bg-white/20' : ''}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off')}
                >
                  <Repeat size={18} className={repeatMode !== 'off' ? 'text-white' : 'text-white/50'} />
                  {repeatMode === 'one' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-violet-600 text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Volume Control */}
          <motion.div
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Volume2 size={18} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">Volume</h3>
                <p className="text-xs text-slate-400">{selectedAudioZone.name}</p>
              </div>
              <span className="text-lg font-semibold text-slate-900">{selectedAudioZone.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedAudioZone.volume}
              onChange={(e) => updateZoneVolume(selectedZone, Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-r
                [&::-webkit-slider-thumb]:from-violet-500
                [&::-webkit-slider-thumb]:to-purple-500
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </motion.div>

          {/* Audio Zones */}
          <motion.div
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Audio Zones</h3>
            <div className="grid grid-cols-2 gap-3">
              {zones.map((zone, index) => {
                const Icon = zone.icon;
                return (
                  <motion.div
                    key={zone.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedZone === zone.id
                        ? 'ring-2 ring-violet-400 bg-violet-50'
                        : zone.isPlaying
                          ? 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                          : 'bg-slate-50/50 hover:bg-slate-100 border border-slate-50'
                    }`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + index * 0.03 }}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        zone.isPlaying ? 'bg-violet-100' : 'bg-slate-100'
                      }`}>
                        <Icon size={18} className={zone.isPlaying ? 'text-violet-600' : 'text-slate-400'} />
                      </div>
                      <motion.button
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          zone.isPlaying ? 'bg-violet-500' : 'bg-slate-200'
                        }`}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleZonePlay(zone.id);
                        }}
                      >
                        {zone.isPlaying ? (
                          <Pause size={12} className="text-white" />
                        ) : (
                          <Play size={12} className="text-slate-400 ml-0.5" />
                        )}
                      </motion.button>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{zone.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">{zone.source}</span>
                      <div className="flex items-center gap-1">
                        <Volume2 size={10} className="text-slate-300" />
                        <span className="text-xs text-slate-400">{zone.volume}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom Spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default MediaScreen;
