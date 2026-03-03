#!/bin/bash
# update-release.sh - Update the GitHub release for BalanceBooks Pro v2.1.0
# Usage: GITHUB_TOKEN=ghp_xxx ./scripts/update-release.sh
# Or:    gh release edit main --repo Bjay0727-jay/balancebooks-pro ...

set -euo pipefail

REPO="Bjay0727-jay/balancebooks-pro"
RELEASE_ID="280536488"
VERSION="v2.1.0"

BODY=$(cat <<'RELEASE_BODY'
## 📥 Downloads

| Platform | File | Notes |
|----------|------|-------|
| **Windows** | `.exe` installer | Standard Windows installer |
| **Mac (Intel)** | `.dmg` | For Intel-based Macs |
| **Mac (Apple Silicon)** | `-arm64.dmg` | For M1/M2/M3/M4 Macs |
| **Linux** | `.AppImage` | Universal Linux package |

## 🌐 Web App
Use instantly at: https://app.balancebooksapp.com

## What's New in v2.1.0

### 🎨 Redesigned Brand & UI
- New color scheme matching the BalanceBooks landing page (teal `#00b4d8` / navy `#12233d`)
- New rounded-rect ledger logo replacing the shield icon
- DM Sans font replacing Inter across the entire app
- Updated PWA manifest, theme colors, and install banner
- New download page with platform-specific release packages

### ✂️ Split Transactions
- Split a single transaction across multiple category allocations
- Visual split badge on transactions with category breakdowns
- Budget engine updated for accurate split-aware category tracking

### ⌨️ Keyboard Shortcuts & Accessibility
- Press **N** for new transaction, **/** for search, arrow keys for month navigation
- Press **1-5** to switch views, **?** for shortcut help overlay
- ARIA labels on all interactive elements for screen reader support

### 📡 Offline-First PWA Hardening
- Enhanced service worker with navigate fallback and client claims
- Outdated cache cleanup for reliable offline behavior
- Improved Workbox caching strategies for fonts and CDN resources

### 🔑 License & Analytics Infrastructure
- LemonSqueezy license activation/deactivation flow
- Privacy-respecting analytics opt-in with sendBeacon
- Pro feature gating (Dropbox sync, debt planner, analytics, unlimited transactions)
RELEASE_BODY
)

if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "Updating release $RELEASE_ID on $REPO..."

  # Update release name and body via GitHub API
  curl -s -X PATCH \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/$REPO/releases/$RELEASE_ID" \
    -d "$(python3 -c "
import json, sys
print(json.dumps({
    'name': 'BalanceBooks Pro $VERSION',
    'tag_name': 'main',
    'body': '''$BODY'''
}))
")" | python3 -c "
import sys, json
r = json.load(sys.stdin)
if 'html_url' in r:
    print(f'✓ Release updated: {r[\"html_url\"]}')
else:
    print(f'✗ Error: {r.get(\"message\", \"unknown\")}')
    sys.exit(1)
"

  echo ""
  echo "To also push the v2.1.0 tag:"
  echo "  git push origin v2.1.0"
  echo ""
  echo "To trigger the CI workflow for fresh builds:"
  echo "  gh workflow run build-installers.yml --field version=2.1.0"

elif command -v gh &> /dev/null; then
  echo "Using gh CLI to update release..."

  gh release edit main \
    --repo "$REPO" \
    --title "BalanceBooks Pro $VERSION" \
    --notes "$BODY"

  echo "✓ Release updated via gh CLI"
  echo ""
  echo "To push v2.1.0 tag: git push origin v2.1.0"
  echo "To trigger CI: gh workflow run build-installers.yml --field version=2.1.0"

else
  echo "Error: No GITHUB_TOKEN set and gh CLI not found."
  echo ""
  echo "Option 1: Set GITHUB_TOKEN and re-run:"
  echo "  GITHUB_TOKEN=ghp_xxx $0"
  echo ""
  echo "Option 2: Install gh CLI and login:"
  echo "  gh auth login"
  echo "  $0"
  echo ""
  echo "Option 3: Push the v2.1.0 tag to trigger CI:"
  echo "  git push origin v2.1.0"
  exit 1
fi
