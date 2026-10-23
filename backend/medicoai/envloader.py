"""Tiny .env loader shared by Django settings and the helper modules.

Looks for a `.env` file in the repository root (or one level above it) and
copies its KEY=VALUE pairs into os.environ. Real environment variables always
win over the file, so production hosts can just set env vars instead.
"""
import os
from pathlib import Path

_LOADED = False


def load_env_file():
    global _LOADED
    if _LOADED:
        return
    _LOADED = True

    here = Path(__file__).resolve()
    candidates = [here.parents[2] / ".env", here.parents[3] / ".env"]

    for env_path in candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        break


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]
