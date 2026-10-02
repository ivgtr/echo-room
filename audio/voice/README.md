# 3場面の合成音声

Irodori-TTS / Irodori-v4.1-Smallで制作した、架空の設備保守担当者の声です。実在人物の録音・声の模倣は使用していません。

- `first-contact.wav`：既存台詞「……聞こえるか？」、1.72秒。冒頭と最終送信で**同一の原音**を使います
- `identity.wav`：既存台詞「20分後のお前だ。」、2.36秒。声紋照合の確認後だけ再生します
- `reference.wav`：同じ声を再制作するための合成参照音声。ゲームからは取得・再生しません

48kHz mono PCM16の生成原本をそのまま保存しています。アプリは`src/audio/voiceManifest.ts`の固定Git commit URLから必要な2ファイルだけを取得します。`public/`へコピーしたり、アプリへimportしたりしないでください。通信加工と音量調整は単一Sound Managerで再生時だけ行います。アプリの音声転送量は合計391,836 bytes、制作参照を含むGit内のWAVは1,705,194 bytesです。

## 制作・確認

モデル・コードの固定revision、合成参照、prompt、seed、checksumは[provenance.json](provenance.json)、利用条件と制作ツールの表示は[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)を参照してください。

2台詞はヒントを与えない日本語ASRで文言一致を確認しました。音割れsampleは0件です。これは演技、息づかい、声の同一性や実機での聴取確認ではありません。3場面を実際に聴いてから声とmixの採用・拡大を判断してください。

SilentCipherの埋込処理は有効で、生成後の原音は加工・圧縮していません。ただし短い2台詞では完全なwatermark payloadの復号に成功しておらず、復号検証済みとは扱いません。制作参照では完全復号を確認しています。
