#!/usr/bin/env bash
# Links chrome/ and user.js from this repo into your default Firefox profile.
# Usage: ./install.sh [profile-dir]
set -euo pipefail

repo="$(cd "$(dirname "$0")" && pwd)"

find_profile() {
  local base ini rel
  for base in "$HOME/.config/mozilla/firefox" "$HOME/.mozilla/firefox"; do
    ini="$base/installs.ini"
    [[ -f $ini ]] || continue
    rel="$(grep -m1 '^Default=' "$ini" | cut -d= -f2-)"
    [[ -n $rel && -d $base/$rel ]] && { echo "$base/$rel"; return; }
  done
  return 1
}

profile="${1:-$(find_profile)}" || { echo "Couldn't find a Firefox profile; pass its path as an argument." >&2; exit 1; }
echo "Profile: $profile"

for name in chrome user.js; do
  target="$profile/$name"
  if [[ -e $target && ! -L $target ]]; then
    mv "$target" "$target.bak.$(date +%s)"
    echo "Backed up existing $name"
  fi
  ln -sfn "$repo/$name" "$target"
  echo "Linked $name"
done

echo "Done. Restart Firefox."
