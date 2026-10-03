export type SubtitleSize = 'small' | 'medium' | 'large';
export type SubtitleBackground = 'soft' | 'solid';
export type TextSpeed = 'slow' | 'normal' | 'fast';

export type SubtitleSettings = {
  size: SubtitleSize;
  background: SubtitleBackground;
  speed: TextSpeed;
};

export type SoundLevels = {
  effects: number;
  environment: number;
};

export type SubtitleSettingChange = <Key extends keyof SubtitleSettings>(
  key: Key,
  value: SubtitleSettings[Key],
) => void;

export const defaultSubtitleSettings: SubtitleSettings = {
  size: 'medium',
  background: 'soft',
  speed: 'normal',
};

export const defaultSoundLevels: SoundLevels = {
  effects: 100,
  environment: 70,
};
