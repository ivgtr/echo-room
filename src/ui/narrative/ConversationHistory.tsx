import { useId } from 'react';

import type { NarrativeEntry } from './narrativeArchive';

export function ConversationHistory({
  history,
}: {
  history: readonly NarrativeEntry[];
}) {
  const titleId = useId();
  return (
    <section className="conversation-history" aria-labelledby={titleId}>
      <h3 id={titleId}>CONVERSATION / 会話履歴</h3>
      {history.length === 0 ? (
        <p>まだ記録された会話はない。</p>
      ) : (
        <ol className="archive-list">
          {history.map((entry) => (
            <li
              className="console-record"
              key={entry.id}
              data-kind={entry.kind}
            >
              <span>{entry.speaker ?? kindLabel(entry.kind)}</span>
              <p>{entry.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function kindLabel(kind: NarrativeEntry['kind']) {
  if (kind === 'system') return 'FACILITY SYSTEM';
  if (kind === 'discovery') return 'DISCOVERY';
  return '主人公';
}
