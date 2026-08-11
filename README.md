# ECHO ROOM / 残響室

音声情報を20分前へ送る研究装置を軸にした、一人称短編脱出ゲームです。2D画像レイヤーと固定視点遷移で疑似3D空間を表現します。

## 必要環境

- Node.js 24.15.0（`.node-version`参照）
- npm 11系
- WebGL 2対応browser

`mise`を使う場合は、リポジトリへ移動した後に次を実行します。

```sh
mise install
npm ci
```

## 開発

```sh
npm run dev
```

本番buildとpreviewは次の通りです。

```sh
npm run build
npm run preview
```

## 検証

```sh
npm run check
npm run test:e2e
```

個別commandの契約と実装工程は[docs/implementation-plan.md](./docs/implementation-plan.md)、現在の進捗は[docs/progress.md](./docs/progress.md)を参照してください。
