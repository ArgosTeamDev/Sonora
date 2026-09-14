import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";
import type { Track } from "@project/shared";

export interface NowPlayingInfo {
  track: Track;
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string | null;
}

interface PlayerContextValue {
  current: NowPlayingInfo | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (info: NowPlayingInfo) => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

// One <audio> element for the whole app, mounted once in RootLayout so
// playback (and the bar showing it) survives page navigation instead of
// resetting every time a page with a TrackList mounts or unmounts.
export function PlayerProvider({ children }: { children: ReactNode }): JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<NowPlayingInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = (): void => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = (): void => setDuration(audio.duration || 0);
    const onEnded = (): void => setCurrentTime(0);
    const onPlay = (): void => setIsPlaying(true);
    const onPause = (): void => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
    // Runs once: the audio element itself is created a single time for the
    // app's lifetime, independent of volume's later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = (info: NowPlayingInfo): void => {
    const audio = audioRef.current;
    if (!audio || !info.track.previewUrl) return;

    const isSameTrack =
      current?.track.trackNumber === info.track.trackNumber && current?.albumId === info.albumId;
    if (!isSameTrack) {
      audio.src = info.track.previewUrl;
      setCurrent(info);
      setCurrentTime(0);
      setDuration(0);
    }
    void audio.play();
  };

  const toggle = (): void => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (isPlaying) audio.pause();
    else void audio.play();
  };

  const seek = (time: number): void => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (value: number): void => {
    const audio = audioRef.current;
    if (audio) audio.volume = value;
    setVolumeState(value);
  };

  const close = (): void => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setCurrent(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const value: PlayerContextValue = {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    toggle,
    seek,
    setVolume,
    close,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
