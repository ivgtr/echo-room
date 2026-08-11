# ECHO ROOM 実装進捗

最終更新: 2026-08-11

| ID | 状態 | 完了内容 | 検証 | Blocker |
|---|---|---|---|---|
| P0-01 | completed | 固定・保留条件、資料優先順位、ID命名規則を`project-decisions.md`へ整理 | 全正本の通読、参照と固定条件の手動照合 | なし |
| P0-02 | completed | Node.js 24.15.0、npm 11系、対象browser、標準commandを確定 | `mise ls node`、`node --version`、`npm --version` | なし |
| P1-01 | completed | Vite・React・PixiJS・XStateの単一actor基盤、1920×1080 Canvas、React overlay、error boundary、非対応環境画面を実装 | `npm run check`、Playwright Chromium title→play E2E | なし |
| P1-02 | completed | dev/build/preview/typecheck/lint/test/E2E/content・asset validation/check commandを実装 | `npm run check` | なし |
| P1-03 | completed | Node 24 + npm ci、check、Chromium E2E、build容量記録のGitHub Actionsを実装 | workflow構文の手動確認、localの同等command成功 | remote CI実行はpush権限外 |
| P2-01 | completed | 1920×1080 letterbox、Canvas・HUD・modal・system layer、pointer/touch/keyboard共通event、reduced-motionを実装 | `npm run check`、desktop Chromium E2E | なし |
| P2-02 | completed | 北東南西4視点を正規ID付きruntime Canvas代替素材で描画し、hotspot・方向移動・DOM accessibility操作を接続 | mouse/keyboard/touch E2E | 本番画像はP4で差替 |
| P2-03 | completed | 暗い北壁、非常灯、BATTERY 00:19:48、冒頭7台詞、音声unlock、字幕、目的表示を実装 | unit、字幕ありE2E | 本番音声待ち |
| P2-04 | completed | 4レバー、4音高、低→高判定、誤答全reset、視覚補助、電源復旧状態を実装 | 正解・誤答・再試行unit、無音・視覚補助・keyboard E2E | 音はWeb Audio仮音 |
| P2-05 | completed | 電源復旧直後のversion付きlocalStorage自動保存、安全checkpoint復元、破損・書込失敗表示を実装 | round-trip・破損unit、reload復元E2E | なし |
| P3-01 | completed | scene関連ID、dialogue、item、document、7 puzzle、21 hint、許可condition/effectのZod schemaとYAMLを実装 | `npm run check`、schema・重複ID・20分差unit、PACKET/参照validation | なし |
| P3-02 | completed | SYSTEM・LOG・AUDIO・SECURITYを持つ端末UI、進行lock、英語見出しと日本語補助、重要時刻の再確認を実装 | `npm run check`、端末component test | AUDIO・SECURITY解放はP3-04 |
| P3-03 | completed | 20分差確認、壁時計情報、0237ロッカー、誤答再試行、ドライバー・カード・フロア図取得を実装 | locker正誤unit、全編E2E | なし |
| P3-04 | completed | カードによるSECURITY図面、所持品図面、隣室不存在、AUDIO PACKET 01〜04と未発言PACKET 04を実装 | story transition unit、全編E2E、PACKET validation | 本番音声待ち |
| P3-05 | completed | ドライバー使用、VOICE ANALYSIS、98〜100%演出、E-01 OCCUPANTと仮人物写真、正体判明導線を実装 | story transition unit、全編E2E | `protagonist_unknown`代替写真 |
| P3-06 | completed | 4台詞選択・並べ替え、誤順拒否、-00:20:00送信、冒頭会話再現、ドア解錠、白い光、endingを実装 | final正誤unit、冒頭からの全編E2E | 本番演出素材待ち |
| P3-07 | completed | 各進行段階に3段階ヒント、誤答後の利用可能表示、任意閲覧を実装 | XState hint level、content 21 hint validation | 停滞時間通知はP5 Timerと統合 |
| P4-01 | completed | 3階層の探索情報、密度上限、誤誘導禁止、壁別dressingを正本化し、WIDE-001〜004の環境ドレッシング改訂previewと4面比較sheetを制作・承認 | 4面1672×941・比較sheet 1920×1080、必須対象・edge cue・禁止decoyの目視照合、`npm run check`、2026-08-11利用者承認 | 高解像度原本とlayer分離はP4-02で継続 |
| P4-02 | in_progress | 承認済み4方向previewを実ゲームへ差し替えるruntime asset・manifest・hotspot輪郭の実装に着手 |  | 全接写、視差layer、状態差分、高解像度原本、実機debug |
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
