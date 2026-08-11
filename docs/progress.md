# ECHO ROOM 実装進捗

最終更新: 2026-08-11

## 現在地と次の着手点

- P0〜P3は完了し、代替画像・字幕・仮音声で冒頭からエンディングまで通して遊べる。
- P4は本素材統合の途中。P4-02の現行画面は利用者から肯定評価を受け、UI工程へ進む指示があったため、実機確認待ちのblockerは2026-08-11に解除された。
- P4-02には正式高解像度原本、独立parallax layer、hit mask、残状態差分が残る。これらはP4-02内で継続するが、P5およびUI品質向上の着手を止めない。
- UIQ-01は完了。方角タブ、矩形調査ボタン、常時目的、常時露出していた音声・タイトル操作を撤去し、画面端・左右キー・スワイプ、背景直接ホットスポット、SYSTEMメニューの単一構造へ置き換えた。
- UIQ-02は完了。ReactとPixiJSが共有する6〜10点の輪郭polygon hotspot、hover・focus・touch接近marker、380msの寄り、動き軽減crossfade、遷移中・modal中のWorld入力停止とfocus復帰を実装した。
- UIQ-03は完了。独白・通信・発見を共通Narrative UIへ整理し、取得演出、所持品トレイと対象使用、SYSTEMの会話履歴・資料再読・字幕・系統別音量設定を実装した。
- UIQ-04は完了。バッテリーをアクティブプレイ時間として実装し、10分・5分・00:00の非常状態、SYSTEM・非表示中の停止、保存復元、動き軽減代替を統合した。
- 次の確認点はUIQ-04の代表画面。利用者確認後はP4-03の正確な画面情報とP5-01の保存完成へ進む。
- P4とP5は依存を満たす範囲で並行する。UIQ-02〜04の最終演出部分だけはP4-05と統合する。

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
| P4-02 | in_progress | 3 bundle・25画像、主要modal背景を統合。Pixi Applicationを単一永続構造へ刷新し、旧Canvas再生成を削除。現在scene保持型double buffer、方向付き240ms crossfade、180度300ms、電源600ms、reduced-motion fade、HTTP cache warming、連続入力時の最新scene収束を実装。UIQ-02でReact・Pixi共通の6〜10点polygon hotspotへ更新。2026-08-11に現行画面への利用者の肯定評価とUI工程移行指示を確認 | asset validation、world/transition unit、同一Canvas維持・全4面fade・電源復旧・全編・touch・輪郭外click拒否E2E | 正式高解像度原本、独立parallax layer、hit mask、残状態差分。UIQ-04の着手は阻害しない |
| P4-03 | pending |  |  | 依存済み。P4-02・UIQと並行着手可能 |
| P4-04 | pending |  |  | 本番音声 |
| P4-05 | in_progress | UIQ-02の380ms調査接近と動き軽減代替、UIQ-03の通信Narrative・所持品取得演出、UIQ-04の10分・5分・00:00段階表示、5分以下の電圧低下と静的な動き軽減代替を実装 | 通常・reduced-motion E2E、1280×720の通信・SYSTEM・critical・reserve画面を目視確認 | 通信ノイズ・声紋解析・送信・ドア解錠・endingの本番演出はP4-02〜04で継続 |
| P5-01 | pending |  |  | 依存済み。UIQと並行着手可能 |
| P5-02 | in_progress | UIQ-02のfocus・modal基盤、UIQ-03の意味を持つNarrative・Inventory・System HTMLと字幕・系統別音量、UIQ-04の文字併記による低残量・critical・reserve通知と動き軽減を実装 | keyboard focus/trap/復帰、無音・字幕拡大・高contrast・reduced-motion E2E、component test | 全編ARIA監査はP6で継続 |
| P5-03 | in_progress | UIQ-01・02の操作基盤に加え、UIQ-03で会話履歴・資料再読・表示速度、必要時だけ開く所持品トレイ、対象調査中のカード・ドライバー使用を実装。自動保存通知は2.4秒で操作を塞がず消去 | Node 24で`npm run check`（11 files/23 tests）、Chromium E2E 8件、Inventoryのmouse・touch・keyboard通し操作 | 全主要checkpointへの履歴永続化と既読会話skipはP5-01・P6で継続 |
| P5-04 | completed | `performance.now()`差分によるアクティブプレイ時間をXStateへ保持。SYSTEMとbrowser非表示中は停止し、00:00で予備電源へ不可逆遷移して進行を継続。経過時間と予備電源状態をversion 1保存へ後方互換で追加 | timer境界・machine・保存移行unit、固定時計E2E（SYSTEM・visibility・復元・reduced-motion）、予備電源開始状態から全編E2E | なし |
| UIQ-01 | completed | 方角タブ・矩形調査ボタン・常時目的・常時音声/タイトル操作を撤去。左右端、左右キー、swipe、画像座標由来の直接hotspot、目的・音声・視覚補助・所持品・ヒント・タイトルを収めたSYSTEMへ単一化。調査messageをevent時だけ表示し、SYSTEMのfocus trap・復帰を実装 | Node 24で`npm run check`成功（9 files/21 tests）、`npm run test:e2e`成功（Chromium 5件: mouse/keyboard/touch/swipe/focus/全編）、通常探索・SYSTEMを1280×720で目視確認 | なし |
| UIQ-02 | completed | 全8対象を6〜10点の画像輪郭polygonへ変更し、ReactとPixiJSの共通View Modelからhit領域を生成。hover・keyboard focus・touch接近marker、380ms zoom、reduced-motion crossfade、遷移・modal中input lock、共通focus trap・起点復帰を実装。対象名を輪郭clipと分離し、狭幅表示の見切れを防止 | Node 24で`npm run check`成功（9 files/21 tests）、`npm run test:e2e`成功（Chromium 7件: polygon境界、連打、resize、縦横復帰、touch、reduced-motion、focus、全編）、304×296のfocus・接近ラベル回帰E2E、北壁focus・接近を1280×720で目視確認 | 正式hit mask入手後の点調整はP4-02で継続 |
| UIQ-03 | completed | 独白・通信・発見を用途別の共通Narrative UIへ整理し、SIGNAL・話者・通信表示を統一。所持品取得演出、必要時トレイ、対象へのカード・ドライバー使用、SYSTEMのARCHIVE・字幕・系統別音量設定を実装 | Node 24で`npm run check`成功（11 files/23 tests）、`npm run test:e2e`成功（Chromium 8件: 無音、字幕拡大・背景・速度、背景復帰、archive、mouse・touch・keyboard所持品、全編）、1280×720通信・ARCHIVE・設定を目視確認 | アクティブ時間と非常演出はUIQ-04、履歴のcheckpoint永続化はP5-01で継続 |
| UIQ-04 | completed | `BATTERY 00:19:48`から実プレイ時間を計測し、10分以下LOW、5分以下CRITICALと電圧低下、00:00のRESERVEを文字と背景で段階表示。SYSTEM内へ停止中の残量と目的を併記し、SYSTEM・browser非表示中の停止、保存復元、00:00後の進行継続、動き軽減を実装 | Node 24で`npm run check`成功（13 files/29 tests）、Chromium E2E 9件（固定時計、pause、visibility、保存復元、reduced-motion、予備電源から全編、keyboard、touch）、1280×720のSYSTEM・critical・reserveを目視確認 | 代表画面の利用者確認待ち。機能blockerなし |
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

## 次作業者への引き継ぎ

1. `docs/README.md`のUIルーティングに従い、`requirements.md` 9〜13章、`technical-design.md` 7・10・15章、`quality-up-plan.md`、`implementation-plan.md`のP2・P5・10章を読む。
2. UIQ-04の1280×720代表画面（SYSTEM停止、5分以下CRITICAL、00:00 RESERVE）について利用者確認を得る。修正指示があればUIQ-04内で反映する。
3. 承認後はP4-03を開始し、時計02:17、BATTERY、端末全メニュー、メモ、フロア図、職員証、4 packetと送信画面の正確な画面情報をHTML/CSSまたは高解像度ラスターで統合する。
4. P5-01はP4-03と並行可能。全主要checkpoint、自動保存、設定保持、保存消去、version移行を完成させる。
5. UIQ-01〜04の単一HUD、polygon hotspot、Narrative・Inventory・System・非常システムを再導入・二重化せず利用する。
