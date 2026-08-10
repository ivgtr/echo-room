# ECHO ROOM 実装進捗

最終更新: 2026-08-11

| ID | 状態 | 完了内容 | 検証 | Blocker |
|---|---|---|---|---|
| P0-01 | completed | 固定・保留条件、資料優先順位、ID命名規則を`project-decisions.md`へ整理 | 全正本の通読、参照と固定条件の手動照合 | なし |
| P0-02 | completed | Node.js 24.15.0、npm 11系、対象browser、標準commandを確定 | `mise ls node`、`node --version`、`npm --version` | なし |
| P1-01 | pending |  |  | なし |
| P1-02 | pending |  |  | なし |
| P1-03 | pending |  |  | なし |
| P2-01 | pending |  |  | P1 Gate |
| P2-02 | pending |  |  | P1 Gate |
| P2-03 | pending |  |  | P1 Gate |
| P2-04 | pending |  |  | P1 Gate |
| P2-05 | pending |  |  | P1 Gate |
| P3-01 | pending |  |  | P2 Gate |
| P3-02 | pending |  |  | P2 Gate |
| P3-03 | pending |  |  | P2 Gate |
| P3-04 | pending |  |  | P2 Gate |
| P3-05 | pending |  |  | P2 Gate |
| P3-06 | pending |  |  | P2 Gate |
| P3-07 | pending |  |  | P2 Gate |
| P4-01 | pending |  |  | 本番素材承認 |
| P4-02 | pending |  |  | P4-01 |
| P4-03 | pending |  |  | P4-01 |
| P4-04 | pending |  |  | 本番音声 |
| P4-05 | pending |  |  | P4-02〜04 |
| P5-01 | pending |  |  | P2・P3 |
| P5-02 | pending |  |  | P2・P3 |
| P5-03 | pending |  |  | P2・P3 |
| P5-04 | pending |  |  | P2・P3 |
| P6-01 | pending |  |  | P4・P5 |
| P6-02 | pending |  |  | P6-01 |
| P6-03 | pending |  |  | P4・P5 |
| P6-04 | pending |  |  | P1以降 |
| P7-01 | pending |  |  | P6 Gate、利用者による初見playtest |
| P7-02 | pending |  |  | P7-01 |
| P8 | pending |  |  | 公開先と明示的な公開許可 |

## 保留事項

- `protagonist_unknown`: 職員証写真と最終人物表現は人物設定の承認待ち。
- 研究所ロゴ: 当面は正確な文字表記のみ。
- 最終フォント: 当面はsystem font stack。
- 本番画像・音声: 正規IDと寸法のCanvas製代替画像、字幕、duration metadataで実装を継続する。
- 告知素材と公開操作: 明示的な依頼があるまで対象外。
