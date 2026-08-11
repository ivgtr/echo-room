# Artwork管理方針

`artwork/`は制作原本と承認履歴を置く場所であり、ゲームから直接参照しない。GitHub Pagesへ配信する圧縮済みruntime素材は`public/assets/`へ置く。

## Git管理するもの

- 美術方向を比較した初期3候補、承認版、contact sheet
- 承認済みreference、wide、close、itemの原本・preview
- 生成条件、参照関係、検収結果を記録した`generation-log.md`

## Git管理しないもの

- 不採用案と途中試行: `artwork/rejected/`
- 生成途中のcopy、比較画像、デバッグ出力: `tmp/`
- build成果物: `dist/`

同じ画素を複数の用途や状態IDで使う場合、`public/assets/manifests/assets.json`の各IDから同じruntimeファイルを参照し、物理ファイルを複製しない。制作上の意味が異なる原本は、Gitのblob重複排除を利用して正規IDごとのパスを維持できる。
