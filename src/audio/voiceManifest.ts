/** Git-hosted masters are deliberately outside public/ and the Vite asset graph. */
const VOICE_ASSET_COMMIT = '3636342f65b453f0da207b6bf5cb2fb7ff31767e';
export const VOICE_BASE_URL = `https://raw.githubusercontent.com/ivgtr/echo-room/${VOICE_ASSET_COMMIT}/audio/voice`;

export const voiceAssets = {
  first_contact: `${VOICE_BASE_URL}/first-contact.wav`,
  identity: `${VOICE_BASE_URL}/identity.wav`,
} as const;

export type VoiceAssetId = keyof typeof voiceAssets;
export type VoiceCue = {
  asset: VoiceAssetId;
  treatment: 'radio' | 'near';
  reveal?: boolean;
};

/** Only these already-displayed lines have voice. PACKET previews stay silent. */
export const voiceCues: Readonly<Record<string, VoiceCue>> = {
  intro_02: { asset: 'first_contact', treatment: 'radio' },
  identity_answer: { asset: 'identity', treatment: 'radio', reveal: true },
  ending_first_contact: { asset: 'first_contact', treatment: 'near' },
};

export type VoicePlayback = {
  entryId: string | null;
  status: 'idle' | 'loading' | 'playing' | 'unavailable';
};
