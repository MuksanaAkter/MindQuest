"""Render the original, self-hosted wrong-answer bloop (no external recordings)."""
import math
import struct
import wave
from pathlib import Path

RATE = 44100
DURATION = 0.82
output = Path(__file__).resolve().parents[1] / 'apps/web/public/sounds/wrong-answer.wav'
output.parent.mkdir(parents=True, exist_ok=True)
frames = bytearray()
phase = 0.0
for i in range(round(RATE * DURATION)):
    t = i / RATE
    # Two friendly descending "boing" syllables with an audible, rounded sustain.
    second = t >= 0.35
    start, length, high, low = (0.35, 0.47, 370, 190) if second else (0, 0.35, 520, 290)
    local = t - start
    fraction = min(1, local / length)
    frequency = high * (low / high) ** fraction + 12 * math.sin(2 * math.pi * 8 * local)
    phase += 2 * math.pi * frequency / RATE
    envelope = min(1, local / .012) * min(1, max(0, (length - local) / .09))
    value = .46 * envelope * (math.sin(phase) + .22 * math.sin(2 * phase)) / 1.22
    frames.extend(struct.pack('<h', round(value * 32767)))
with wave.open(str(output), 'wb') as sound:
    sound.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    sound.writeframes(frames)
print(f'{output.name}: {DURATION}s, {len(frames)} bytes PCM')
