#!/bin/bash
set -euo pipefail

umask 077
token_dir="/Users/jojo/Library/Application Support/travel-lgb"
token_file="$token_dir/duckdns.token"
mkdir -p "$token_dir"

read -r -s -p "DuckDNS Token (hidden): " token
printf '\n'
if [[ -z "$token" ]]; then
  echo "Token cannot be empty" >&2
  exit 1
fi

printf '%s' "$token" > "$token_file"
chmod 600 "$token_file"
unset token
echo "Token saved on Mini; it was not added to Git."
