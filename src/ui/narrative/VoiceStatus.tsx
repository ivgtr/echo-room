import type { VoicePlayback } from '../../audio/voiceManifest';

export function VoiceStatus({
  playback,
  entryId,
}: {
  playback: VoicePlayback;
  entryId: string | undefined;
}) {
  if (
    playback.entryId !== entryId ||
    (playback.status !== 'loading' && playback.status !== 'unavailable')
  )
    return null;
  return (
    <small className="voice-status" role="status">
      {playback.status === 'loading'
        ? '音声を読み込み中…（字幕で進めます）'
        : '音声を再生できませんでした。字幕で進めます'}
    </small>
  );
}
