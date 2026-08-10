# ECHO ROOM プロジェクト決定表

## 1. 目的

本書は、実装開始時点の固定条件、保留条件、識別子規則、開発環境基準をまとめる。体験要件の正本は`requirements.md`、技術詳細の正本は`technical-design.md`、工程の正本は`implementation-plan.md`とし、本書はそれらを置き換えない。

## 2. 固定条件

| 領域 | 決定 | 根拠 |
|---|---|---|
| 表現 | 1920×1080論理画面上の2Dレイヤーと固定視点遷移で疑似3Dを表現する。3Dモデルは使わない | requirements 6章、technical-design 4章・7章 |
| グラフィック | runtime素材はWebPまたはPNGとし、SVGを標準採用しない | graphics-production 2章・5章 |
| 状態 | XState actorを進行状態の唯一の正解とし、ReactとPixiJSは型付きイベントだけを送る | technical-design 5章・6章 |
| コンテンツ | 人が編集する原本はYAML、形式と参照はZodおよび追加validatorで検証する | technical-design 8章・18章 |
| 音声 | 音声開始はゲーム開始操作に結び付け、再生失敗時も字幕で進行できる | technical-design 10章 |
| 保存 | 進行と設定を別々にlocalStorageへ保存し、XState snapshotは保存しない | technical-design 12章 |
| 時間 | 00:19:48からactive play timeだけ減算し、00:00後は予備電源で続行する | technical-design 11章 |
| 操作 | マウス、タッチ、キーボードで同じ必須進行を完了できるようにする | requirements 12章・16章 |
| シナリオ | 7段階の謎、20分差、未来の主人公、4 PACKET、単一endingを変更しない | requirements 2章・7章・8章 |
| 配信 | バックエンドなしの静的buildとし、権限、分析、外部送信を追加しない | technical-design 17章・19章 |

## 3. 要決定事項の実装既定値

| ID | 実装既定値 | 保留範囲 |
|---|---|---|
| D-01 | 20分経過後は予備電源へ移行し、ゲームを続行する | 初見テストで緊迫感を確認する |
| D-02 | 重要台詞は主人公と未来の主人公を同一演者とする。音源完成までは字幕とduration metadataを使う | 本番収録と聴感調整 |
| D-03 / G-D01 | `protagonist_unknown`を正規IDとし、中性的な写真枠を使う | 氏名、年齢、性別表現、写真 |
| D-04 | 前室はendingの出口演出だけに使う | なし |
| D-05 | 端末は英語見出しと日本語補助を併記する | 最終タイポグラフィ |
| D-06 | ヒントは任意表示を基本にし、停滞または誤答時に利用可能通知を出す | 初見テストで閾値を調整する |
| D-07 | desktopを第一対象とし、tablet・smartphoneは横向きに対応する | 実機固有不具合 |
| D-08 | 主要イベント直後の自動保存1枠と設定1枠を使う | なし |
| D-09 | 必要情報を確認するまで本入力を無効化する | なし |
| G-D02 | 研究所名の正確な文字表記を使い、記号ロゴは置かない | 本番ロゴ合成 |
| G-D03 | system font stackを使う | 最終フォントとロゴ |
| G-D04 | Canvas製代替素材を正規ID・正規寸法で生成する | 本番画像生成と差替え |
| G-D05 | 告知素材は作らない | 公開準備 |

これらの保留は該当素材だけを止め、アプリケーション実装を止めない。

## 4. 識別子規則

### 4.1 コンテンツID

- 形式は`<kind>_<semantic_name>`、ASCII小文字のsnake_caseとする。
- kindは`chapter`、`location`、`scene`、`hotspot`、`item`、`dialogue`、`audio`、`puzzle`、`hint`、`document`、`objective`、`flag`、`feedback`を使用する。
- IDは表示文言やファイルパスから独立させ、一度本編データへ登録したIDは表示修正だけでは変更しない。
- 順序が物語上固定されるPACKETは`audio_packet_01`から`audio_packet_04`、対応台詞は`dialogue_packet_01`から`dialogue_packet_04`とする。
- Puzzle IDは`puzzle_emergency_power`、`puzzle_time_offset`、`puzzle_locker`、`puzzle_no_adjacent_room`、`puzzle_audio_packets`、`puzzle_voice_identity`、`puzzle_final_transmission`とする。

### 4.2 グラフィックIDとファイル名

- asset IDは`graphics-generation.yaml`の`gfx-*`を正本とする。
- runtimeファイル名は`<asset-id>__<state>__<layer>__<size>.<ext>`とする。
- 配信用グラフィックにSVGを登録しない。

### 4.3 TypeScript

- TypeScriptの値はcamelCase、型はPascalCase、定数は必要な場合だけUPPER_SNAKE_CASEとする。
- 外部データの文字列IDはbrand型または正規定義から導出したunionを介し、画面コードへ直書きしない。
- XState event typeは過去形または要求形のUPPER_SNAKE_CASEとし、UI部品名を含めない。

## 5. 開発環境基準

| 項目 | 基準 |
|---|---|
| Node.js | 24.15.0（24 LTS系） |
| npm | 11系 |
| OS | Node.js 24を実行できるmacOS、Windows、Linux |
| 対象browser | Chrome、Edge、Firefox、Safariの安定版と一つ前のmajor |
| 画面 | desktop、tablet横、smartphone横。縦向きは回転案内 |
| 描画 | WebGL 2必須。利用不可時は非対応案内 |

標準commandは`implementation-plan.md` P1-02の契約に従い、`dev`、`build`、`preview`、`typecheck`、`lint`、`test`、`test:e2e`、`validate:content`、`validate:assets`、`check`を提供する。

## 6. 停止条件

現在、P0〜P3を止める未解決事項はない。人物設定と本番素材の承認はP4の該当assetだけを止める。真相、ending、主要パズル、技術基盤、対応環境を変更する必要が生じた場合は、実装計画4章に従って作業を停止し、判断を求める。
