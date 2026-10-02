#!/usr/bin/env bash
# Installs the loader that runs chrome/*.uc.js (Ctrl+T palette, "+" menu) into
# Firefox's install dir. Needs root; only has to be done once, Firefox updates
# leave these files alone.
# Usage: sudo ./install-autoconfig.sh [firefox-install-dir]
set -euo pipefail

repo="$(cd "$(dirname "$0")" && pwd)"
ff="${1:-/usr/lib/firefox}"

if [[ ! -x $ff/firefox && ! -x $ff/firefox-bin ]]; then
  echo "No Firefox install found in $ff; pass its path as an argument." >&2
  exit 1
fi

install -Dm644 "$repo/autoconfig/firefox-ui.cfg" "$ff/firefox-ui.cfg"
install -Dm644 "$repo/autoconfig/defaults/pref/firefox-ui-autoconfig.js" "$ff/defaults/pref/firefox-ui-autoconfig.js"

echo "Installed loader into $ff. Restart Firefox."
