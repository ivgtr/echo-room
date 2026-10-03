/** Git-hosted masters are deliberately outside public/ and the Vite asset graph. */
const VOICE_ASSET_COMMIT = '1ede5f2229dc5547c911b70e4d188a3d1ab03be0';
export const VOICE_BASE_URL = `https://raw.githubusercontent.com/ivgtr/echo-room/${VOICE_ASSET_COMMIT}/audio/voice`;

export const voiceAssets = {
  first_contact: `${VOICE_BASE_URL}/first-contact.wav`,
  room: `${VOICE_BASE_URL}/room.wav`,
  exit: `${VOICE_BASE_URL}/exit.wav`,
  restore_power: `${VOICE_BASE_URL}/restore-power.wav`,
  next_terminal: `${VOICE_BASE_URL}/next-terminal.wav`,
  seen_before: `${VOICE_BASE_URL}/seen-before.wav`,
  ignore_log: `${VOICE_BASE_URL}/ignore-log.wav`,
  withheld_explanation: `${VOICE_BASE_URL}/withheld-explanation.wav`,
  packet_power: `${VOICE_BASE_URL}/packet-power.wav`,
  packet_button: `${VOICE_BASE_URL}/packet-button.wav`,
  identity: `${VOICE_BASE_URL}/identity.wav`,
  return_packets: `${VOICE_BASE_URL}/return-packets.wav`,
} as const;

export type VoiceAssetId = keyof typeof voiceAssets;
export type VoiceCue = {
  asset: VoiceAssetId;
  treatment: 'radio' | 'near';
  reveal?: boolean;
};

/** IDs grant no access by themselves: play only displayed or explicitly reread lines. */
export const voiceCues: Readonly<Record<string, VoiceCue>> = {
  intro_02: { asset: 'first_contact', treatment: 'radio' },
  intro_04: { asset: 'room', treatment: 'radio' },
  intro_05: { asset: 'exit', treatment: 'radio' },
  intro_07: { asset: 'restore_power', treatment: 'radio' },
  power_direction: { asset: 'next_terminal', treatment: 'radio' },
  power_answer: { asset: 'seen_before', treatment: 'radio' },
  offset_warning: { asset: 'ignore_log', treatment: 'radio' },
  offset_answer: { asset: 'withheld_explanation', treatment: 'radio' },
  packet_01: { asset: 'first_contact', treatment: 'radio' },
  packet_02: { asset: 'packet_power', treatment: 'radio' },
  packet_03: { asset: 'ignore_log', treatment: 'radio' },
  packet_04: { asset: 'packet_button', treatment: 'radio' },
  identity_answer: { asset: 'identity', treatment: 'radio', reveal: true },
  script_cue: { asset: 'return_packets', treatment: 'radio' },
  ending_first_contact: { asset: 'first_contact', treatment: 'near' },
};

export type VoicePlayback = {
  entryId: string | null;
  status: 'idle' | 'loading' | 'playing' | 'unavailable';
};
