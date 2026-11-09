#!/usr/bin/env python3
"""Copy only this example's files. Refuse collisions; never switch the live layout."""
import os
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
home = Path(os.environ.get("HERDR_APP_HOME", Path.home() / ".config/herdr-app"))
items = [
    "mods/demo-tabs",
    "mods/demo-inspector",
    "mods/demo-pane",
    "layouts/demo-right-panel.json",
    "layouts/demo-right-panel.svg",
]
# Preflight every destination before copying anything.
for item in items:
    target = home / item
    if target.exists() or target.is_symlink():
        raise SystemExit(f"Refusing to overwrite: {target}")
for item in items:
    source, target = root / item, home / item
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        shutil.copy2(source, target)
print(f"Installed to {home}; current layout unchanged.")
print('Preview: herdr-app do layout.switch --name demo-right-panel')
