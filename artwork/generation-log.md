# ECHO ROOM グラフィック生成ログ

## GFX-ITEM-003 主人公の職員証写真

- 生成日: 2026-08-11
- 用途: 職員用アクセスカード、VOICE ANALYSISの本人照合
- provider / mode: OpenAI built-in `image_gen`、承認済みGFX-REF-001 cinematic v6を美術方向参照とした新規生成
- model / model version / seed: built-in toolから非公開
- 人物設定: 32歳前後の日本人男性。短い黒髪。地下研究施設の設備保守・運用担当。濃灰の高襟作業着。氏名と不要な経歴は設定しない。
- prompt要旨: 正面、頭肩、平坦な寒色白色光、無地の寒色グレー背景、自然で落ち着いた普通の表情。文字、ロゴ、職員証、記章、道具、劇的な色光、英雄的・美容的演出を禁止。
- 無加工生成物: built-in toolの保存原本を保持し、作業用copyを`tmp/imagegen/gfx-item-003__source.png`へ配置。
- 承認原本: `items/gfx-item-003/gfx-item-003__approved__portrait-master__1120x1400.png`。生成時の1122×1402から中心を各辺1pxだけcropし、正確な4:5にした。
- runtime: 同じ承認原本から`public/assets/images/items/`へ職員証用と声紋解析用の512×640 WebPを個別書き出し。
- 目視検収: 単一人物、年齢感、髪型、保守作業着、正面性、crop安全域、無地背景を確認。生成文字、ロゴ、透かし、記章、背景設備、赤／cyanの色光は見られない。

## GFX-REF-001 美術方向キーフレーム

- 生成日: 2026-08-11
- 用途: P4 Stage 0 art-direction approval preview
- provider: OpenAI built-in `image_gen`
- model / model version / seed: built-in toolから非公開
- 生成方式: 新規生成3候補後、各候補を参照編集で1回修正

### 共通prompt

- 2039年、日本の先端研究所地下にある小規模な実験室。
- 青灰色コンクリート、緑灰色の塗装鋼板、黒い樹脂、露出配管、工業金具。
- 頑丈なアナログ操作部と、低彩度の青緑色試作端末を一つずつ含める。
- 写実寄りのシネマティックな2Dゲーム背景コンセプトアート。
- 一人称、目線高1.65m、28〜32mm相当、水平、16:9。
- 冷白色作業灯と深い赤色非常灯。事故直後だが稼働中で、廃墟やホラーではない。
- 人物、手、文字、ロゴ、透かし、窓、隣室開口、3Dレンダー調、宇宙船、サイバーパンクを禁止。

### 候補

| 候補 | ファイル                                          | 方向性                                                           |
| ---- | ------------------------------------------------- | ---------------------------------------------------------------- |
| A    | `candidates/gfx-ref-001__candidate-a-preview.png` | 静かな余白、整理された作業机、アナログ計器と青緑端末の対比       |
| B    | `candidates/gfx-ref-001__candidate-b-preview.png` | 最も簡潔な設備配置、コンクリートと鋼板を中心とした抑制的な研究室 |
| C    | `candidates/gfx-ref-001__candidate-c-preview.png` | 配管と機械密度が高く、事故直後の赤色非常灯を強めた工業的な研究室 |

初回候補には窓状の開口が生成されたため不採用とし、各候補で該当部分だけを無開口のコンクリート・鋼板設備壁へ参照編集した。初回候補は再現記録として`artwork/rejected/`にローカル保持し、通常Gitには含めない。

### 候補C ローポリ方向調整

- 利用者判断: 方向性はC。写実的な表面情報をもう少しローポリ寄りに調整する。
- 出力: `candidates/gfx-ref-001__candidate-c-lowpoly-preview.png`
- 生成方式: 候補Cを単一参照としたOpenAI built-in `image_gen`のstyle-transfer編集。
- prompt要旨: カメラ、構図、室形状、全設備、配管、閉鎖壁パネル、赤／シアン照明を固定し、金属面と床の微細テクスチャを広い材質面、控えめな多角形facet、角張った明暗遷移へ整理する。明白な3Dレンダー、玩具調、voxel、cel shading、vector、窓、人物、文字を禁止する。
- 目視検収: 固定対象と密閉空間を維持し、壁・床・設備に中程度の面構成が追加された。過度なデフォルメ、禁止要素、文字・透かしは見られない。

#### 限定色調整 v2

- 利用者判断: 初回調整はローポリ感が薄いため、色数をさらに抑える。
- 出力: `candidates/gfx-ref-001__candidate-c-lowpoly-v2-preview.png`
- 生成方式: 初回調整版Cを単一参照としたOpenAI built-in `image_gen`のstyle-transfer編集。
- prompt要旨: 固定対象を維持し、環境色を炭黒、2〜3段階の青灰、鈍い緑灰、白色灯、赤、シアンへ限定する。環境の陰影を4〜6段階程度の明確な色面に圧縮し、微細な反射と材質ノイズを大きなpolygon面へ統合する。
- 目視検収: 左パネル、中央壁、床、機器筐体の大きな色面と角張った境界を確認。配管・計器の識別性、密閉性、赤／シアンの焦点を維持し、禁止要素、文字・透かしは見られない。

#### 光源整合調整 v3

- 利用者判断: v2は光源を考えた塗り方に違和感がある。
- 出力: `candidates/gfx-ref-001__candidate-c-lowpoly-v3-preview.png`
- 生成方式: v2を単一参照としたOpenAI built-in `image_gen`のlighting-weather編集。
- prompt要旨: 限定色と固定対象を維持し、主天井灯、計器盤task light、右上の赤色非常灯、装置のシアン光を独立した光源として定義する。面の向き、距離、遮蔽、接触影に従って4〜6段階の明暗を割り当て、光源と無関係な三角形の明色面を除去する。
- 目視検収: 白色灯の下向き照射、右上からの赤色減衰、装置近傍だけのシアンspill、機器下面と接地点の影を確認。構図、設備、密閉性、限定色、禁止要素を維持している。

#### ローポリ・光源統合調整 v4

- 利用者判断: v3は光源整合の修正時にローポリ設定が弱まっている。両方の文脈を維持する。
- 出力: `candidates/gfx-ref-001__candidate-c-lowpoly-v4-preview.png`
- 生成方式: v2を低色数・面構成の正本、v3を照明配置だけの補助参照としたOpenAI built-in `image_gen`のstyle-transfer編集。
- prompt要旨: 大きなpolygon facet、材質ごとの3〜5段階の値、限定paletteを必須としながら、各facetの明暗を面の向き、光源距離、投影影、遮蔽で決定する。白色主灯、計器灯、赤色非常灯、シアン装置光の照射範囲を分離し、滑らかな写実塗りと無関係な迷彩状patchの両方を禁止する。
- 目視検収: 左パネル、中央壁、床、機器に明瞭な大面facetを確認。主灯の下向き照射、右上の赤色減衰、装置近傍のシアンspill、接触影を同時に維持し、固定対象と禁止要素に逸脱はない。

#### シネマティックSF脱出ADV方向 v5 / v6

- 利用者判断: ローポリ中心の方針から、重厚で緊張感のあるSF脱出ゲームのkey visualへ方向転換する。構図は維持し、自然な金属質感、情報量、密室感、知的suspenseを強化する。
- 初稿: `candidates/gfx-ref-001__candidate-c-cinematic-v5-preview.png`
- 表面調整稿: `candidates/gfx-ref-001__candidate-c-cinematic-v6-preview.png`
- 生成方式: v4を単一参照としたOpenAI built-in `image_gen`のstyle-transfer編集後、v5を単一参照として残存facetだけをprecise-object-editで修正。
- prompt要旨: 左の密閉扉、中央のanalog制御盤、右のcyan発光装置を三点anchorとして固定する。金属の継ぎ目、留め具、interlock、状態灯、配線、擦れ、接触影、抑制的な反射を追加し、謎解き空間の情報を非言語的に配置する。赤／青緑の非常時照明を維持し、low-poly facet、安価な3D、過剰なcyberpunk、horror、既存作品の模倣を禁止する。
- 目視検収: v5で重厚感、機械detail、情報密度、視線誘導を確認。v6で扉、中央壁、床の三角facetを方向性のある金属仕上げへ置換し、構図、機械detail、照明、密閉性、禁止要素を維持している。

### 解像度の扱い

previewはすべて1672×941。美術方向の選定にのみ使用する。シネマティック表面調整v6の承認後、これを単一参照としてGFX-REF-001 masterとGFX-REF-002を制作し、仕様の3840×2160以上を満たす。単純な拡大補間は行わない。

## Stage 1 基準画像・制作基準

- art direction承認日: 2026-08-11
- 承認内容: GFX-REF-001 cinematic v6を正本とし、重厚な金属、非言語的な謎情報、密室感、赤／青緑の静かな非常時照明を以後へ継承する。
- provider: GFX-REF-002のみOpenAI built-in `image_gen`。GFX-REF-003 / 004はImageMagickによる手動raster制作。

| ID          | 出力                                                    | 生成・制作内容                                          | 検収                                                                     |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| GFX-REF-002 | `reference/gfx-ref-002/gfx-ref-002__preview-flat.png`   | v6を美術正本、REF-004を配置正本として北壁正面を参照生成 | 中央密閉扉、空表示筐体、左上時計、右intercom、字幕安全域、窓・別開口なし |
| GFX-REF-003 | `reference/gfx-ref-003/gfx-ref-003__material-board.png` | v6とREF-002から6種の表面cropと7色の基準swatchを整理     | 新規材質を追加せず、金属、樹脂、床、赤灯、cyan glassを固定               |
| GFX-REF-004 | `reference/gfx-ref-004/gfx-ref-004__reference.png`      | canonical_spaceを2048角の同一原点4 layerへ手動作図      | 5.2m×4.0m、4壁の設備位置、開始視点、開口禁止を明記                       |

REF-002は1672×941のgeometry承認用preview。REF-003 / 004は2048×2048。geometry承認後に単純拡大ではない高解像度制作原本とruntime書き出しへ進む。

## Stage 2 4方向広角preview

- canonical room geometry承認日: 2026-08-11
- provider: OpenAI built-in `image_gen`。WIDE-001はgeometry driftを避けるため、承認済みREF-002をそのまま継承。
- 共通参照: GFX-REF-002（形状・北壁）、GFX-REF-003（材質・色）、GFX-REF-004（配置・左右関係）。
- 共通prompt要旨: 目線高1.65m、28〜32mm、水平、同一室寸法、下部24%字幕安全域を固定。重厚な自然金属、整理された非言語情報、冷白・赤・cyanの局所照明を継承し、low-poly、安価な3D、窓、別開口、生成文字を禁止する。

| ID           | 向き | 出力                                                        | 配置検収                                                            |
| ------------ | ---- | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| GFX-WIDE-001 | 北   | `wide/gfx-wide-001/gfx-wide-001__powered__preview-flat.png` | 中央密閉扉、左上時計、右intercom、上部空表示筐体                    |
| GFX-WIDE-002 | 東   | `wide/gfx-wide-002/gfx-wide-002__powered__preview-flat.png` | 中央blank terminal、右service panel、左端に北壁扉・intercom cue     |
| GFX-WIDE-003 | 南   | `wide/gfx-wide-003/gfx-wide-003__powered__preview-flat.png` | 中央desk、椅子、blank paper、左端east cue、右端west cue             |
| GFX-WIDE-004 | 西   | `wide/gfx-wide-004/gfx-wide-004__powered__preview-flat.png` | 左locker、右4-lever breaker、右端north door cue、左端south desk cue |

- 横断preview: `wide/gfx-wide-stage2__contact-sheet-preview.jpg`
- 修正: WIDE-003の北壁表示に似た不要筐体を通常task lightへ置換。WIDE-004左端の誤ったcyan端末cueを南壁desk端へ置換。
- rejected: toolの無関係出力と配置drift稿は`artwork/rejected/`にローカル保持し、通常Gitには含めない。
- 現解像度: 全4面1672×941のcross-view承認用preview。承認後に同一構図の高解像度制作、layer分離、state差分へ進む。

### 探索密度・環境ドレッシング改訂 v2

- 設計正本: `docs/graphics-production.md` 3.7、設計commit `302f732`
- provider / mode: OpenAI built-in `image_gen`、各WIDE初稿を単一参照とした`precise-object-edit`
- 共通方針: 必須対象の位置、画角、隣接壁cue、赤／青緑の照明を固定し、低contrastの保守設備・家具と最近の作業痕跡を追加する。既存パズルの視覚文法、追加UI、文字、窓、別開口を禁止する。

| ID           | 改訂出力                                                               | 追加内容                                                                      | 目視検収                                                                                    |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| GFX-WIDE-001 | `wide/gfx-wide-001/gfx-wide-001__powered__dressed-v2-preview-flat.png` | 密閉utility canister、床drain、cable tray、配管support、扉枠の擦過痕          | 扉、時計、intercom、空表示筐体を維持。容器に錠・数字・状態灯なし                            |
| GFX-WIDE-002 | `wide/gfx-wide-002/gfx-wide-002__powered__dressed-v2-preview-flat.png` | 整備stool、cable reel、cooling manifold、parts tray、端末下の焦げ跡           | blank terminalと解析panelを維持。追加screen・入力部・工具なし                               |
| GFX-WIDE-003 | `wide/gfx-wide-003/gfx-wide-003__powered__dressed-v2-preview-flat.png` | rolling cart、waste bin、desk lamp、工具case、ずれた椅子                      | blank paperと東西edge cueを維持。追加monitor・開いた容器なし                                |
| GFX-WIDE-004 | `wide/gfx-wide-004/gfx-wide-004__powered__dressed-v2-preview-flat.png` | hose reel、折り畳みstep、utility dolly、glove、床drain、破れたinspection seal | lockerの空4桁窓と正確に4本のlever、中央余白、南北edge cueを維持。追加switch・数字・発光なし |

- 横断preview: `wide/gfx-wide-stage2__dressed-v2-contact-sheet-preview.jpg`（1920×1080、北東南西の2×2比較）
- 現解像度: 全4面1672×941。探索密度とcross-view continuityの利用者承認を得るまで、接写・state差分・高解像度制作へ進まない。

### P4-02 runtime広角統合

- 利用者承認日: 2026-08-11
- 入力: 各`dressed-v2-preview-flat.png`。元画像を変更せず、runtime用WebPを別出力した。
- powered: 品質88のWebPへ書き出し。生成previewの1672×941を維持し、ゲーム側で1920×1080論理Canvasへfitする暫定runtime素材とした。
- emergency: poweredと同一geometryから明度・彩度を抑え、深い赤色gradeを重ねて派生。物体位置を再生成していない。
- 出力: `public/assets/images/world/gfx-wide-001`〜`004`の`powered.webp` / `emergency.webp`。
- 制約: 3840×2160以上の制作原本、1920×1080の正式runtime書き出し、layer分離は未完了。単純拡大を制作原本として扱わず、P4-02内で継続する。

### Stage 3 接写preview・runtime統合

- provider / mode: OpenAI built-in `image_gen`。承認済みWIDEまたは直前の承認可能な接写を単一参照とした`precise-object-edit`。
- 共通方針: 同じ対象、材質、光源、周辺wall cueを維持し、16:9の中央80%へ操作対象を収める。正確な文字・数字・記号は生成せず、P4-03のHTML／高解像度raster合成へ分離する。
- 出力: `artwork/close/gfx-close-001`〜`012`。基礎12 IDに加え、紙あり／取得後、locker閉／内容物あり／空、panel閉／開、toggle OFF／ONの計17状態を制作した。
- exact-count検収: CLOSE-005はlever 4本、CLOSE-007は空表示4枠とinput zone 4つ、CLOSE-011はpacket slot 4つと赤button 1つ。
- 修正: CLOSE-009初稿に生成文字が混入したため不採用とし、無地銘板へ限定編集した。CLOSE-010の縦長drift稿は不採用とし、承認可能な16:9 panel open稿からOFF／ONを派生した。
- runtime: 17状態を品質88のWebPとして`public/assets/images/close/`へ書き出し、`room_closeups` bundleへ登録。breaker、locker lock、terminal、analysis、final transmissionの既存HTML UI背景へ接続した。
- 制約: 現在は1672×941の実機debug用preview。正式な2560×1440以上の接写原本、個別hit mask、可動part分離、全状態差分の完成は利用者の実機確認後に継続する。
