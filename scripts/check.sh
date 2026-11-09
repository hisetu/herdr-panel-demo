#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --experimental-vm-modules --test tests/*.test.js
herdr-app check "$PWD/mods/demo-tabs"
herdr-app check "$PWD/mods/demo-inspector"
herdr-app check "$PWD/mods/demo-pane"
