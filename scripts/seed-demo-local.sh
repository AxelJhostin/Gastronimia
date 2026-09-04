#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
supabase_cli="$repo_root/frontend/node_modules/.bin/supabase"
demo_sql="$repo_root/supabase/demo-data.sql"
db_container="supabase_db_Gastronimia"

if [[ ! -x "$supabase_cli" ]]; then
  echo "Instala las dependencias con npm --prefix frontend ci." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop debe estar iniciado." >&2
  exit 1
fi

cd "$repo_root"
"$supabase_cli" start >/dev/null
eval "$("$supabase_cli" status -o env)"

case "$API_URL" in
  http://127.0.0.1:*|http://localhost:*) ;;
  *) echo "Operación cancelada: la URL de Supabase no es local." >&2; exit 1 ;;
esac

service_headers=(-H "Authorization: Bearer $SERVICE_ROLE_KEY" -H "apikey: $SERVICE_ROLE_KEY")

upsert_user() {
  local email="$1"
  local password="$2"
  local full_name="$3"
  local users_json user_id payload

  users_json="$(curl --fail --silent --show-error "${service_headers[@]}" "$API_URL/auth/v1/admin/users?per_page=1000")"
  user_id="$(printf '%s' "$users_json" | jq -r --arg email "$email" '[.users[]? | select(.email == $email)] | first | .id // empty')"
  payload="$(jq -nc --arg email "$email" --arg password "$password" --arg full_name "$full_name" '{email:$email,password:$password,email_confirm:true,user_metadata:{full_name:$full_name}}')"

  if [[ -z "$user_id" ]]; then
    user_id="$(curl --fail --silent --show-error -X POST "${service_headers[@]}" -H 'Content-Type: application/json' --data "$payload" "$API_URL/auth/v1/admin/users" | jq -r '.id')"
  else
    curl --fail --silent --show-error -X PUT "${service_headers[@]}" -H 'Content-Type: application/json' --data "$payload" "$API_URL/auth/v1/admin/users/$user_id" >/dev/null
  fi

  printf '%s' "$user_id"
}

admin_id="$(upsert_user 'axel@gmail.com' 'axelaxel' 'Axel Hernández')"
manager_id="$(upsert_user 'encargado@gastronomia.test' 'Prueba-Encargado-2026!' 'María Encargada')"
teacher_id="$(upsert_user 'docente@gastronomia.test' 'Prueba-Docente-2026!' 'Daniela Docente')"

docker exec -i "$db_container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -v admin_id="$admin_id" -v manager_id="$manager_id" -v teacher_user_id="$teacher_id" \
  < "$demo_sql" >/dev/null

echo "Datos de demostración listos."
echo "ADMIN    axel@gmail.com / axelaxel"
echo "MANAGER  encargado@gastronomia.test / Prueba-Encargado-2026!"
echo "TEACHER  docente@gastronomia.test / Prueba-Docente-2026!"
