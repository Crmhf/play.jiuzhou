#!/usr/bin/env python3
"""Import and normalize the user-provided combat audio pack for the web build.

Usage:
  python3 tools/import-combat-audio.py /path/to/1700款音频素材...

Requires ffmpeg/ffprobe. The source pack is intentionally not copied wholesale;
only the small curated set below is converted to web-ready MP3 assets.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

SAMPLES = {
    "blade-swing-01.mp3": "001-449款刀剑类音效/大刀挥舞zth705011.wav",
    "blade-swing-02.mp3": "001-449款刀剑类音效/挥剑声-xh20070524.wav",
    "polearm-swing-01.mp3": "003-300款武术动作类音效/枪、棍挥舞、气流混响-xys20070515.wav",
    "polearm-swing-02.mp3": "002-116款棍棒类音效/棍棒挥舞5-重-LTT20070510.wav",
    "bow-release-01.mp3": "007-49款弓弩类音效/弓-射出去1-ltt20070417.wav",
    "bow-release-02.mp3": "007-49款弓弩类音效/弓-射出去3-ltt20070417.wav",
    "hit-body-01.mp3": "001-449款刀剑类音效/击中-肉体10-ltt20070417.wav",
    "hit-body-02.mp3": "008-107款打架打斗类音效/打架打中人 01.wav",
    "hit-armor-01.mp3": "001-449款刀剑类音效/刀击中(铁器)3-WQ20070524.wav",
    "hit-armor-02.mp3": "001-449款刀剑类音效/剑击中-WQ20070511.wav",
    "hit-heavy-01.mp3": "016-28款重兵器类音效/兵器重击1-LTT20070523.wav",
    "hit-heavy-02.mp3": "016-28款重兵器类音效/大椎重击3-YS070524.wav",
    "skill-wind-01.mp3": "001-449款刀剑类音效/挥舞的剑释放出魔法-YS070510.wav",
    "skill-impact-01.mp3": "001-449款刀剑类音效/气流、刀剑击中1-xys20070510.wav",
    "ultimate-blade-01.mp3": "001-449款刀剑类音效/刀剑类特殊效果2-多声-好-LTT20070518.wav",
}


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def duration(path: Path) -> float:
    raw = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)
    ])
    return float(json.loads(raw.decode("utf-8", "replace"))["format"]["duration"])


def convert(source: Path, target: Path) -> None:
    d = duration(source)
    fade_start = max(0.01, d - min(0.06, d * 0.18))
    audio_filter = (
        "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,"
        "highpass=f=38,"
        "acompressor=threshold=-16dB:ratio=2.2:attack=4:release=90:makeup=2dB,"
        "alimiter=limit=0.88,"
        f"afade=t=out:st={fade_start:.4f}:d={max(0.02, d-fade_start):.4f}"
    )
    run(
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-vn", "-map_metadata", "-1", "-af", audio_filter,
        "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "96k", str(target),
    )


def make_pressure_layer(output_dir: Path, target: Path) -> None:
    """Build a subtle 40.5s boss-pressure loop from the normalized impacts.

    It sits under the main MiniMax track only during Boss fights. Low-passed heavy
    impacts become war-drum-like pulses while armor hits add sparse metallic accents.
    """
    heavy = output_dir / "hit-heavy-01.mp3"
    armor = output_dir / "hit-armor-01.mp3"
    wind = output_dir / "skill-wind-01.mp3"
    heavy_delays = [2400, 6400, 10400, 14400, 18400, 22400, 26400, 30400, 34400, 38400]
    armor_delays = [4400, 12400, 20400, 28400, 36400]
    wind_delays = [8200, 24200]

    inputs = ["-f", "lavfi", "-t", "40.4956", "-i", "anullsrc=r=44100:cl=stereo"]
    labels: list[str] = []
    filters = ["[0:a]volume=0[base]"]
    index = 1
    for delay in heavy_delays:
        inputs += ["-i", str(heavy)]
        filters.append(
            f"[{index}:a]asetrate=36000,aresample=44100,lowpass=f=760,volume=0.19,"
            f"adelay={delay}|{delay},apad=pad_dur=40.5[h{index}]"
        )
        labels.append(f"[h{index}]")
        index += 1
    for delay in armor_delays:
        inputs += ["-i", str(armor)]
        filters.append(
            f"[{index}:a]highpass=f=1200,volume=0.075,adelay={delay}|{delay},"
            f"apad=pad_dur=40.5[a{index}]"
        )
        labels.append(f"[a{index}]")
        index += 1
    for delay in wind_delays:
        inputs += ["-i", str(wind)]
        filters.append(
            f"[{index}:a]lowpass=f=2600,volume=0.045,adelay={delay}|{delay},"
            f"apad=pad_dur=40.5[w{index}]"
        )
        labels.append(f"[w{index}]")
        index += 1
    filters.append(
        f"[base]{''.join(labels)}amix=inputs={1+len(labels)}:duration=first:normalize=0,"
        "acompressor=threshold=-22dB:ratio=2:attack=8:release=180,"
        "loudnorm=I=-18:TP=-3:LRA=8,"
        "alimiter=limit=0.82,afade=t=in:st=0:d=0.35,afade=t=out:st=40.1:d=0.35[out]"
    )
    run(
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
        "-filter_complex", ";".join(filters), "-map", "[out]", "-t", "40.4956",
        "-ar", "44100", "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", str(target),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Root directory of the 1700-sound combat pack")
    parser.add_argument(
        "--output", type=Path,
        default=Path(__file__).resolve().parents[1] / "public/assets/audio/combat",
    )
    args = parser.parse_args()
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe are required")
    missing = [rel for rel in SAMPLES.values() if not (args.source / rel).is_file()]
    if missing:
        raise SystemExit("Missing source files:\n" + "\n".join(missing))

    args.output.mkdir(parents=True, exist_ok=True)
    for name, rel in SAMPLES.items():
        convert(args.source / rel, args.output / name)
        print(f"created {args.output / name}")
    pressure = args.output.parent / "sanguo-boss-pressure.mp3"
    make_pressure_layer(args.output, pressure)
    print(f"created {pressure}")


if __name__ == "__main__":
    main()
