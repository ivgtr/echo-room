# ECHO ROOM 実装進捗

最終更新: 2026-08-12

## 現在地と次の着手点

- P0〜P3は完了し、代替画像・字幕・正式な手続き生成サウンドで冒頭からエンディングまで通して遊べる。
- P4は本素材統合の途中。P4-02の現行画面は利用者から肯定評価を受け、UI工程へ進む指示があったため、実機確認待ちのblockerは2026-08-11に解除された。
- P4-02には正式高解像度原本、独立parallax layer、hit mask、残状態差分が残る。これらはP4-02内で継続するが、P5およびUI品質向上の着手を止めない。
- UIQ-01は完了。方角タブ、矩形調査ボタン、常時目的、常時露出していた音声・タイトル操作を撤去し、画面端・左右キー・スワイプ、背景直接ホットスポット、SYSTEMメニューの単一構造へ置き換えた。
- UIQ-02は完了。ReactとPixiJSが共有する6〜10点の輪郭polygon hotspot、hover・focus・touch接近marker、380msの寄り、動き軽減crossfade、遷移中・modal中のWorld入力停止とfocus復帰を実装した。
- UIQ-03は完了。独白・通信・発見を共通Narrative UIへ整理し、取得演出、所持品トレイと対象使用、SYSTEMの会話履歴・資料再読・字幕・系統別音量設定を実装した。
- UIQ-04は完了。バッテリーをアクティブプレイ時間として実装し、10分・5分・00:00の非常状態、SYSTEM・非表示中の停止、保存復元、動き軽減代替を統合した。2026-08-11に代表画面の利用者承認を得た。
- P4-03は完了。時計02:17、非常電源用紙、緊急時メモ、端末時刻、施設図、職員カード、主人公写真、4 PACKET・送信先・4枠を正確なHTML/CSSと本番rasterで統合した。
- 主人公は32歳前後の日本人男性、短い黒髪、設備保守・運用担当、濃灰の作業着に確定した。氏名や不要な経歴は設定せず、同一写真原本を職員証とVOICE ANALYSISへ使用する。
- P5-01は完了。全主要checkpointを進行schema v2へ自動保存し、設定の別枠保存、非対応version・破損進行の保護と確認付き消去を実装した。
- P5-02は完了。現行の単一Hotspot View Modelから意味を持つDOMを生成し、modal中の探索無効化、focus trap・復帰、通知role、SYSTEMの動き軽減設定、keyboardのみの全編ルートを完成した。
- P5-03は完了。冒頭7台詞を通常に読み終えた時だけ既読状態を保存し、次回以降は単一Narrative UIからskip可能にした。skip後のSYSTEMへのfocus移動と、全7台詞のARCHIVE復元も統合した。
- 発話音声を使用しない方針を2026-08-11に確定。台詞はHTML字幕、PACKETは文章と声紋特徴量、音響は環境音・効果音・通信ノイズだけの単一構造とする。
- P4-04は完了。旧tone playerを削除し、非常電源・復旧後の環境音と通信・接続・回路・電源・ロック・解析・送信・ドア解錠cueを単一Sound Managerへ統合した。
- P4-04の操作音を拡張し、話者差のないレトロゲーム風text blipと共通UI clickをeffectsへ追加。字幕速度と句読点へ同期する文字送り、早押し全文表示、動き軽減時の即時表示へ接続した。
- P5は全作業完了。次の着手点はP4-02の正式高解像度原本・layer分離・hit mask・残状態差分と、P4-05の残演出。
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
| P2-03 | completed | 暗い北壁、非常灯、BATTERY 00:19:48、冒頭7台詞、Web Audio unlock、字幕、目的表示を実装 | unit、字幕ありE2E | なし |
| P2-04 | completed | 4レバー、4音高、低→高判定、誤答全reset、視覚補助、電源復旧状態を実装。P4-04で正式Sound Managerへ統合 | 正解・誤答・再試行unit、無音・視覚補助・keyboard E2E | なし |
| P2-05 | completed | 電源復旧直後のversion付きlocalStorage自動保存、安全checkpoint復元、破損・書込失敗表示を実装 | round-trip・破損unit、reload復元E2E | なし |
| P3-01 | completed | scene関連ID、dialogue、item、document、7 puzzle、21 hint、許可condition/effectのZod schemaとYAMLを実装 | `npm run check`、schema・重複ID・20分差unit、PACKET/参照validation | なし |
| P3-02 | completed | SYSTEM・LOG・AUDIO・SECURITYを持つ端末UI、進行lock、英語見出しと日本語補助、重要時刻の再確認を実装 | `npm run check`、端末component test | AUDIO・SECURITY解放はP3-04 |
| P3-03 | completed | 20分差確認、壁時計情報、0237ロッカー、誤答再試行、ドライバー・カード・フロア図取得を実装 | locker正誤unit、全編E2E | なし |
| P3-04 | completed | カードによるSECURITY図面、所持品図面、隣室不存在、SIGNAL PACKET 01〜04と未発言PACKET 04を実装 | story transition unit、全編E2E、PACKET validation | なし |
| P3-05 | completed | ドライバー使用、VOICE ANALYSIS、98〜100%演出、E-01 OCCUPANTと人物写真、正体判明導線を実装 | story transition unit、全編E2E | なし |
| P3-06 | completed | 4台詞選択・並べ替え、誤順拒否、-00:20:00送信、冒頭会話再現、ドア解錠、白い光、endingを実装 | final正誤unit、冒頭からの全編E2E | 本番演出素材待ち |
| P3-07 | completed | 各進行段階に3段階ヒント、誤答後の利用可能表示、任意閲覧を実装 | XState hint level、content 21 hint validation | 停滞時間通知はP5 Timerと統合 |
| P4-01 | completed | 3階層の探索情報、密度上限、誤誘導禁止、壁別dressingを正本化し、WIDE-001〜004の環境ドレッシング改訂previewと4面比較sheetを制作・承認 | 4面1672×941・比較sheet 1920×1080、必須対象・edge cue・禁止decoyの目視照合、`npm run check`、2026-08-11利用者承認 | 高解像度原本とlayer分離はP4-02で継続 |
| P4-02 | in_progress | 3 bundle・25画像、主要modal背景を統合。Pixi Applicationを単一永続構造へ刷新し、旧Canvas再生成を削除。現在scene保持型double buffer、方向付き240ms crossfade、180度300ms、電源600ms、reduced-motion fade、HTTP cache warming、連続入力時の最新scene収束を実装。UIQ-02でReact・Pixi共通の6〜10点polygon hotspotへ更新。2026-08-11に現行画面への利用者の肯定評価とUI工程移行指示を確認 | asset validation、world/transition unit、同一Canvas維持・全4面fade・電源復旧・全編・touch・輪郭外click拒否E2E | 正式高解像度原本、独立parallax layer、hit mask、残状態差分。UIQ-04の着手は阻害しない |
| P4-03 | completed | 時計接写へ正確な02:17のHTML/CSS時計盤、デスク接写へ非常電源テスト用紙を合成。端末SYSTEMへ-00:20:00・02:17・02:37と緊急時メモ、SECURITYと所持品へE-01の左右に隣室がない施設図、職員カードへE-01・SECURITY権限と同一原本の主人公写真を表示。VOICE ANALYSISへ本人写真を統合し、最終送信を4つの明示slot、4 PACKET、送信先-00:20:00、赤い送信buttonへ整理 | Node 24で`npm run check`成功（14 files/33 tests、4 bundle/27画像）、Chromium E2E 10件（本人写真、時計・用紙接写、カード・図面、全端末時刻、予備電源状態から全編、keyboard・touch・focus復帰、4 slot送信）、1280×720の代表8画面を目視確認 | なし |
| P4-04 | completed | 発話音声・voice系統・会話`audioId`・howler.js・旧tone playerを削除。設定schema v4のSOUND master、effects、environmentに対応する単一Sound Managerを実装し、非常電源・復旧後の機械ハムと共通UI click・話者差のないtext blip・通信・接続・回路・電源・ロック・解析・送信・ドア解錠cueを手続き生成。文字送りは字幕速度・句読点へ同期し、早押し全文表示と動き軽減時の即時表示に対応。SYSTEM・非表示・title・OFFで再生中nodeを停止し、再開操作で復帰。SIGNAL字幕とPACKET声紋特徴量照合を維持 | Node 24で`npm run check`成功（16 files/49 tests、4 bundle/27画像、build 581.67kB）。ChromiumでSound lifecycle、全編keyboard、導入、通常探索を個別検証。最終一括E2Eは依頼者の省略指示により11/13件通過時点で停止（1件interrupted、1件not run） | なし |
| P4-05 | in_progress | UIQ-02の380ms調査接近と動き軽減代替、UIQ-03の通信Narrative・所持品取得演出、UIQ-04の10分・5分・00:00段階表示、5分以下の電圧低下と静的な動き軽減代替を実装。P4-04で通信ノイズ・解析・送信・ドア解錠サウンドを統合 | 通常・reduced-motion E2E、1280×720の通信・SYSTEM・critical・reserve画面を目視確認 | 水滴・端末起動・送信時発光・ドア解錠・白飛び・endingの残視覚演出はP4-02・P4-05で継続 |
| P5-01 | completed | 電源復旧、20分差確認、ロッカー解錠、隣室不存在、PACKET 04、本人照合、最終順序、送信開始、ending完了の9つを安全checkpointとしてschema v2へ保存。所持品、確認済み図面・PACKET、ヒント・誤答、active time、予備電源をdomain dataで復元。字幕・音量・視覚補助は別keyへ即時保存し、進行消去後も保持。現行schemaだけを受理し、破損・非対応versionは上書きせず、タイトルで確認後に進行だけ消去可能 | Node 24で`npm run check`成功（14 files/39 tests）。Chromium E2E 11件で全9 checkpointの実保存、late-game復元、設定reload、破損・非対応version保護と消去、keyboard・touch・focus復帰、予備電源からendingを検証 | なし |
| P5-02 | completed | Hotspot View Modelから名前・役割・順序を持つReact DOM overlayを生成。modal中は探索操作を`inert`化し、focus trapと起点復帰を統一。重要音の字幕・視覚通知、色以外の正誤表現、音高補助を維持し、OS設定を初期値とするSYSTEMの動き軽減設定と全編keyboard操作を完成 | Node 24で`npm run check`成功（14 files/39 tests、4 bundle/27画像）。Chromium E2E 11件でkeyboardのみの新規開始から電源復旧、9checkpoint後からending、focus trap・復帰・`inert`・alert/status・設定保存を検証。動き軽減設定を1280×720で目視確認 | なし |
| P5-03 | completed | 連打・二重click・戻る・画面回転・遷移中input lockの共通基盤、会話履歴・資料再読・表示速度、必要時だけ開く所持品トレイ、対象調査中のカード・ドライバー使用を統合。自動保存通知は2.4秒で操作を塞がず消去。冒頭会話は初見時にskipを表示せず、通常読了後だけ現行設定schemaへ既読を保存し、次回はNarrative UI内でskipできる | Node 24で`npm run check`成功（14 files/40 tests）。Chromium E2E 12件で初見のskip非表示・既読保存・keyboard skip・SYSTEM focus・ARCHIVE復元と既存のmouse・touch・keyboard・連打・resize・設定reloadを検証。skip UIを1280×720で目視確認 | なし |
| P5-04 | completed | `performance.now()`差分によるアクティブプレイ時間をXStateへ保持。SYSTEMとbrowser非表示中は停止し、00:00で予備電源へ不可逆遷移して進行を継続。経過時間と予備電源状態をschema v2へ保存 | timer境界・machine・保存schema unit、固定時計E2E（SYSTEM・visibility・復元・reduced-motion）、予備電源開始状態から全編E2E | なし |
| UIQ-01 | completed | 方角タブ・矩形調査ボタン・常時目的・常時音声/タイトル操作を撤去。左右端、左右キー、swipe、画像座標由来の直接hotspot、目的・音声・視覚補助・所持品・ヒント・タイトルを収めたSYSTEMへ単一化。調査messageをevent時だけ表示し、SYSTEMのfocus trap・復帰を実装 | Node 24で`npm run check`成功（9 files/21 tests）、`npm run test:e2e`成功（Chromium 5件: mouse/keyboard/touch/swipe/focus/全編）、通常探索・SYSTEMを1280×720で目視確認 | なし |
| UIQ-02 | completed | 全8対象を6〜10点の画像輪郭polygonへ変更し、ReactとPixiJSの共通View Modelからhit領域を生成。hover・keyboard focus・touch接近marker、380ms zoom、reduced-motion crossfade、遷移・modal中input lock、共通focus trap・起点復帰を実装。対象名を輪郭clipと分離し、狭幅表示の見切れを防止 | Node 24で`npm run check`成功（9 files/21 tests）、`npm run test:e2e`成功（Chromium 7件: polygon境界、連打、resize、縦横復帰、touch、reduced-motion、focus、全編）、304×296のfocus・接近ラベル回帰E2E、北壁focus・接近を1280×720で目視確認 | 正式hit mask入手後の点調整はP4-02で継続 |
| UIQ-03 | completed | 独白・通信・発見を用途別の共通Narrative UIへ整理し、SIGNAL・話者・通信表示を統一。所持品取得演出、必要時トレイ、対象へのカード・ドライバー使用、SYSTEMのARCHIVE・字幕・系統別音量設定を実装 | Node 24で`npm run check`成功（11 files/23 tests）、`npm run test:e2e`成功（Chromium 8件: 無音、字幕拡大・背景・速度、背景復帰、archive、mouse・touch・keyboard所持品、全編）、1280×720通信・ARCHIVE・設定を目視確認 | アクティブ時間と非常演出はUIQ-04、履歴のcheckpoint永続化はP5-01で継続 |
| UIQ-04 | completed | `BATTERY 00:19:48`から実プレイ時間を計測し、10分以下LOW、5分以下CRITICALと電圧低下、00:00のRESERVEを文字と背景で段階表示。SYSTEM内へ停止中の残量と目的を併記し、SYSTEM・browser非表示中の停止、保存復元、00:00後の進行継続、動き軽減を実装。2026-08-11に代表画面の利用者承認を取得 | Node 24で`npm run check`成功（13 files/29 tests）、Chromium E2E 9件（固定時計、pause、visibility、保存復元、reduced-motion、予備電源から全編、keyboard、touch）、1280×720のSYSTEM・critical・reserveを目視確認 | なし |
| P6-01 | pending |  |  | P4・P5 |
| P6-02 | pending |  |  | P6-01 |
| P6-03 | pending |  |  | P4・P5 |
| P6-04 | pending |  |  | P1以降 |
| P7-01 | pending |  |  | P6 Gate、利用者による初見playtest |
| P7-02 | pending |  |  | P7-01 |
| P8 | pending |  |  | 公開先と明示的な公開許可 |

## 保留事項

- 研究所ロゴ: 当面は正確な文字表記のみ。
- 最終フォント: 当面はsystem font stack。
- 本番画像: 正規IDと寸法のCanvas製代替画像から正式高解像度原本への差替えを継続する。サウンドは手続き生成の正式実装に確定済み。
- 告知素材と公開操作: 明示的な依頼があるまで対象外。

## 次作業者への引き継ぎ

1. `docs/README.md`のグラフィック・テストルーティングに従い、`graphics-production.md`、`graphics-generation.yaml`、`requirements.md` 6・8〜10・15・16章、`technical-design.md` 7・13・14・18章、`implementation-plan.md`のP4-02〜05とP6を読む。
2. P4-02の正式高解像度原本・layer分離・hit mask・残状態差分と、P4-05の残視覚演出を完了してP4 Gateを閉じる。P4-04の単一Sound Managerへ別playerや発話音声を追加しない。
3. P5は完了。進行はv2、設定はv4だけを正規形式とし、旧fixtureや旧読込分岐を追加しない。
4. `tmp/p5-02-motion-settings.png`、`tmp/p5-03-intro-skip.png`、`tmp/p4-04-sound-settings.png`、`tmp/p4-05-text-blip.png`は実画面確認用。その他の一時画像も引き続きignore済みの`tmp/`へ集約する。
5. P4-04は完了。P4-02とP4-05が残るため、P4全体が完了するまでP6 Gateは閉じたままとする。
