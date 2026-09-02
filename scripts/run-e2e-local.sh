#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
supabase_cli="$repo_root/frontend/node_modules/.bin/supabase"
run_dir="$(mktemp -d "${TMPDIR:-/tmp}/gastronomia-e2e.XXXXXX")"
backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "$frontend_pid" ]]; then
    kill "$frontend_pid" 2>/dev/null || true
    wait "$frontend_pid" 2>/dev/null || true
  fi
  if [[ -n "$backend_pid" ]]; then
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  fi
  rm -rf -- "$run_dir"
}
trap cleanup EXIT INT TERM

wait_for_url() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 60); do
    if curl --fail --silent --show-error "$url" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "No fue posible iniciar $label. Revisa los logs en $run_dir." >&2
  return 1
}

ensure_running() {
  local pid="$1"
  local label="$2"
  local log_file="$3"
  if kill -0 "$pid" 2>/dev/null; then return 0; fi
  echo "$label terminó antes de completar el arranque:" >&2
  sed -n '1,160p' "$log_file" >&2
  return 1
}

if [[ ! -x "$supabase_cli" ]]; then
  echo "Instala las dependencias del frontend con npm ci antes de ejecutar E2E." >&2
  exit 1
fi

cd "$repo_root"
"$supabase_cli" start >/dev/null
"$supabase_cli" db reset --local
eval "$("$supabase_cli" status -o env)"

export SUPABASE_URL="$API_URL"
export SUPABASE_JWKS_URL="$API_URL/auth/v1/.well-known/jwks.json"
export SUPABASE_PUBLISHABLE_KEY="$PUBLISHABLE_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export TEST_API_BASE_URL="http://127.0.0.1:8000"
export NEXT_PUBLIC_API_BASE_URL="$TEST_API_BASE_URL"
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_PUBLISHABLE_KEY"
export CYPRESS_BASE_URL="http://localhost:3000"

npm --prefix "$repo_root/frontend" run build

(
  cd "$repo_root/backend"
  exec env PYTHONPATH=. ./.venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 --port 8000
) >"$run_dir/backend.log" 2>&1 &
backend_pid="$!"

(
  cd "$repo_root/frontend"
  exec ./node_modules/.bin/next start --hostname 127.0.0.1
) >"$run_dir/frontend.log" 2>&1 &
frontend_pid="$!"

wait_for_url "http://127.0.0.1:8000/api/v1/health" "FastAPI"
wait_for_url "http://localhost:3000/login" "Next.js"
ensure_running "$backend_pid" "FastAPI" "$run_dir/backend.log"
ensure_running "$frontend_pid" "Next.js" "$run_dir/frontend.log"

npm --prefix "$repo_root/frontend" run e2e:run
