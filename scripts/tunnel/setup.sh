#!/usr/bin/env bash
set -euo pipefail

# Reconnect milla-rayne.com → local Milla-Rayne app (default :5000).
#
# Prereq: connector JWT from Zero Trust → Tunnels → Configure → install command,
#         OR fetch via API (account token + tunnel UUID — not account ID).
#
# Usage:
#   CLOUDFLARE_TUNNEL_TOKEN='eyJ...' ./scripts/tunnel/setup.sh
#   # or put CLOUDFLARE_TUNNEL_TOKEN in .env.tunnel and run without env var

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env.tunnel"
SERVICE_NAME="cloudflared-milla-rayne"
UNIT_SRC="$ROOT/scripts/tunnel/cloudflared.service"
UNIT_DST="/etc/systemd/system/${SERVICE_NAME}.service"

if ! command -v cloudflared >/dev/null; then
  echo "cloudflared not found. Install: sudo pacman -S cloudflared"
  exit 1
fi

TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
if [[ -z "$TOKEN" && -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
fi

if [[ -z "$TOKEN" ]]; then
  cat <<'EOF'
Missing CLOUDFLARE_TUNNEL_TOKEN (JWT starting with eyJ..., NOT cfat_ API token).

1. Open https://one.dash.cloudflare.com → Networks → Tunnels → milla-nexus
2. Configure → copy the install-command token (eyJ...)
3. Public hostname should be milla-rayne.com → http://localhost:5000
4. Copy the connector token, then either:
     echo 'CLOUDFLARE_TUNNEL_TOKEN=eyJ...' > .env.tunnel
     chmod 600 .env.tunnel
     ./scripts/tunnel/setup.sh
   or:
     CLOUDFLARE_TUNNEL_TOKEN='eyJ...' ./scripts/tunnel/setup.sh
EOF
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "CLOUDFLARE_TUNNEL_TOKEN=$TOKEN" >"$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Wrote $ENV_FILE"
fi

if ! curl -sf http://127.0.0.1:5000/ >/dev/null; then
  echo "Warning: nothing responding on http://127.0.0.1:5000 — start the app first (PORT=5000 npm start)."
fi

sudo cp "$UNIT_SRC" "$UNIT_DST"
sudo sed -i "s|/home/milla/Milla-Rayne|$ROOT|g" "$UNIT_DST"
sudo systemctl daemon-reload
sudo systemctl enable --now "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo ""
echo "Tunnel starting. Verify: curl -sI https://milla-rayne.com | head -5"
