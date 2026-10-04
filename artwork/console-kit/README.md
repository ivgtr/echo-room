# Console hardware kit

2026-10-03、OpenAIの組み込み画像生成で制作。既存の端末008と送信装置011を参照し、画面枠・記録片・操作部の3原本から書き出した生成素材。第三者素材や外部フォントの追加はない。

原本PNGはLibraryへ保存し、通常Gitには含めない。正確な生成promptは同ディレクトリの3つの`__generation-prompt.txt`へ保持する。モデル・seedはツールから公開されていない。

## 配信素材

`public/assets/images/console/`のlossless WebP 9点、合計584,986 bytes。矩形cropと縮小のみで、既存画像の拡大や手続き描画への置換は行っていない。

| 接頭辞 `gfx-console-` 以下 | 寸法    | nine-slice（上・右・下・左） |
| -------------------------- | ------- | ---------------------------- |
| screen__blank__frame       | 705×398 | 90                           |
| glass__blank__fill         | 320×138 | —                            |
| record__blank__carrier     | 731×100 | 34 72 34 72                  |
| key__neutral__sprite       | 252×120 | 27 31 27 31                  |
| knob__neutral__sprite      | 192×192 | —                            |
| jack__empty__sprite        | 174×176 | —                            |
| transmit__idle__sprite     | 192×196 | —                            |
| cover__closed__sprite      | 192×236 | —                            |
| toggle__neutral__sprite    | 144×196 | —                            |

枠と記録片は角を固定して中央だけ伸縮し、共通のglassを下地に使う。その他の部品は比率を維持する。生成alphaを保持し、カバー越しに赤ボタンを見せる。

文字・時刻・波形・端記号・正確な図面・配線経路は従来のDOM/Canvasに残す。四つの受信窓は同じ画像を使い、個別の絵・色・記号で正解対応を示さない。画像の検収と実プレイ画面の検証は区別する。
