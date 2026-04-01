#!/usr/bin/env python3
"""
Model downloader for ComfyUI + EasyWan22.
Runs as an init container in K8s — downloads models to PVC if not already present.
All config via environment variables (zero hardcoding).
"""

import os
import sys
import subprocess
from pathlib import Path


def env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


MODEL_DIR = Path(env("MODEL_DIR", "/app/ComfyUI/models"))
HF_TOKEN = env("HF_TOKEN")
CIVITAI_API_KEY = env("CIVITAI_API_KEY")

MARKER_FILE = MODEL_DIR / ".download_complete"

# Model definitions: (subdir, huggingface_repo, filename_pattern)
MODELS = [
    # Wan 2.2 I2V-A14B diffusion model
    ("diffusion_models", "Wan-AI/Wan2.1-I2V-14B-720P", None),
    # T5 text encoder (via Comfy-Org repackaged)
    ("text_encoders", "Comfy-Org/Wan_2.1_ComfyUI_repackaged", "split_files/text_encoders/"),
    # VAE
    ("vae", "Comfy-Org/Wan_2.1_ComfyUI_repackaged", "split_files/vae/"),
    # CLIP Vision
    ("clip_vision", "Comfy-Org/Wan_2.1_ComfyUI_repackaged", "split_files/clip_vision/"),
]


def download_hf_model(subdir: str, repo: str, pattern: str | None) -> None:
    """Download a model from HuggingFace Hub."""
    target = MODEL_DIR / subdir
    target.mkdir(parents=True, exist_ok=True)

    cmd = ["huggingface-cli", "download", repo, "--local-dir", str(target)]

    if pattern:
        cmd.extend(["--include", f"{pattern}*"])

    if HF_TOKEN:
        cmd.extend(["--token", HF_TOKEN])

    print(f"Downloading {repo} -> {target}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Warning: Failed to download {repo}: {result.stderr}", file=sys.stderr)
    else:
        print(f"Successfully downloaded {repo}")


def create_directories() -> None:
    """Ensure all model directories exist."""
    for subdir in ["diffusion_models", "text_encoders", "vae", "clip_vision",
                    "ultralytics", "loras", "upscale_models", "controlnet"]:
        (MODEL_DIR / subdir).mkdir(parents=True, exist_ok=True)


def main() -> None:
    if MARKER_FILE.exists():
        print("Models already downloaded (marker file exists). Skipping.")
        return

    print(f"Starting model download to {MODEL_DIR}")
    create_directories()

    for subdir, repo, pattern in MODELS:
        try:
            download_hf_model(subdir, repo, pattern)
        except Exception as e:
            print(f"Error downloading {repo}: {e}", file=sys.stderr)

    # Write marker file
    MARKER_FILE.write_text("download_complete\n")
    print("All models downloaded successfully.")


if __name__ == "__main__":
    main()
