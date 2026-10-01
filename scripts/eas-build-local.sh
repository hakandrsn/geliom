#!/usr/bin/env bash
# Yerel production build: .env'deki build-time secret'ları (SENTRY_AUTH_TOKEN)
# shell'e yükleyip `eas build --local` çalıştırır. Yarn'ın script kabuğu
# `. ./.env` desteklemediği için bu adım ayrı bir bash script'inde.
# Kullanım: yarn build:ios | yarn build:android
set -euo pipefail

platform="${1:?platform gerekli: ios | android}"
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "⚠️  .env bulunamadı — Sentry source map upload başarısız olabilir" >&2
fi

exec eas build -p "$platform" --profile production --local
