# 3場面の合成音声

Irodori-TTS / Irodori-v4.1-Smallで制作した、架空の設備保守担当者の声です。実在人物の録音・声の模倣は使用していません。

- `first-contact.wav`：既存台詞「……聞こえるか？」、1.40秒。冒頭と最終送信で**同一の原音**を使います
- `identity.wav`：既存台詞「20分後のお前だ。」、2.68秒。声紋照合の確認後だけ再生します
- `reference.wav`：同じ声を再制作するための合成参照音声。ゲームからは取得・再生しません

48kHz mono PCM16の生成原本をそのまま保存しています。アプリは`src/audio/voiceManifest.ts`の固定Git commit URLから必要な2ファイルだけを取得します。`public/`へコピーしたり、アプリへimportしたりしないでください。通信加工と音量調整は単一Sound Managerで再生時だけ行います。アプリの音声転送量は合計391,836 bytes、制作参照を含むGit内のWAVは1,593,834 bytesです。

## 制作・確認

モデル・コードの固定revision、合成参照、prompt、seed、checksumは[provenance.json](provenance.json)、利用条件と制作ツールの表示は[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)を参照してください。

2026-10-03に利用者の試聴で採用したA80の2台詞です。同じ新規合成参照から80 stepsで生成し、採用ファイルをそのまま配置しました。2台詞の全文ASRは文言一致、音割れsampleは0件ですが、短い切り出しの認識には曖昧さがあり、余分な声がないことを機械検査だけで保証しません。ゲーム内3場面のmixとiOS Safariでの聴取は未確認です。

SilentCipherの埋込処理は有効で、生成後の原音は加工・圧縮していません。ただし短い2台詞では完全なwatermark payloadの復号に成功しておらず、復号検証済みとは扱いません。制作参照では完全復号を確認しています。
