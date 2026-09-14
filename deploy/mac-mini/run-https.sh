#!/bin/bash
set -euo pipefail

token_file="/Users/jojo/Library/Application Support/travel-lgb/duckdns.token"
if [[ ! -r "$token_file" ]]; then
  echo "DuckDNS token is missing: $token_file" >&2
  exit 1
fi

DUCKDNS_API_TOKEN="$(<"$token_file")"
export DUCKDNS_API_TOKEN
exec /Users/jojo/Sites/travel-LGB/bin/caddy-duckdns run \
  --config /Users/jojo/Sites/travel-LGB/alias/Caddyfile.https \
  --adapter caddyfile
