# Voice-generation provenance and third-party notices

The WAV files are original synthetic fictional speech generated for ECHO ROOM issue #21. No human recording or named real-person voice was used. Opening and final transmission intentionally reuse the same `first-contact.wav` source. `reference.wav` is a synthetic production reference, not an in-game line.

Irodori-TTS v4.1 Small model and the Semantic-DACVAE-Japanese-32dim codec model are published under MIT. The Irodori model card additionally prohibits unconsented impersonation and misleading deepfakes or misinformation; it warns that a generated voice may coincidentally resemble a real person.

Sources:

- Irodori model: https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small
- Codec model: https://huggingface.co/Aratako/Semantic-DACVAE-Japanese-32dim
- Irodori code: https://github.com/Aratako/Irodori-TTS/tree/89f9d8fbd4d51ea019867ee1197725ede1df13c5
- DACVAE code, Apache-2.0: https://github.com/facebookresearch/dacvae/blob/414c20785fc3a28373073ea8ef7a1316eeeaca6e/LICENSE
- SilentCipher code: https://github.com/SesameAILabs/silentcipher/tree/d46d7d0893a583d8968ab3a6626e2289faec9152

Only generated audio is included; no model weights or generation software are redistributed here. The following notices identify the generation tools and do not by themselves assign a separate license to the generated audio.

SilentCipher watermark embedding was enabled. The saved WAV masters are unchanged, with no lossy compression or post-processing. The full expected watermark payload was recovered from the reference but not reliably from the two short target clips. See `provenance.json` for exact checksums, parameters and verification limits.

## Irodori-TTS code notice

MIT License

Copyright (c) 2026 Aratako

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## SilentCipher code notice

MIT License

Copyright (c) 2024 Sony Research Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
