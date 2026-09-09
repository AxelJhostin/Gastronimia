#!/usr/bin/env bash
set -euo pipefail

# Usa los servicios existentes. No reinicia ni restaura la base de datos.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"
eval "$(./frontend/node_modules/.bin/supabase status -o env)"
export SUPABASE_URL="$API_URL"
export SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export TEST_API_BASE_URL="http://127.0.0.1:8000"
export CYPRESS_BASE_URL="http://localhost:3000"
curl --fail --silent "$TEST_API_BASE_URL/api/v1/health" >/dev/null
curl --fail --silent "$CYPRESS_BASE_URL/login" >/dev/null
npm --prefix frontend run e2e:run -- "$@"
