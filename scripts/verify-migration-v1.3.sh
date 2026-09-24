#!/usr/bin/env bash
# Local-only check of scripts/migrate-v1.3.sql: build a DB with the OLD schema + BankX demo, migrate it,
# compare row counts and values, and compare its structure with a DB built from the NEW schema.
set -euo pipefail

# Refuse unless we're clearly pointed at the local cyber-pg container, not a remote database.
# This script never itself connects via DATABASE_URL (it always shells into the local
# `cyber-pg` docker container), but if the caller's environment carries a DATABASE_URL
# pointing elsewhere, that's a sign this was invoked in the wrong context — refuse.
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    *localhost*|*127.0.0.1*|*cyber-pg*) ;;
    *) echo "refusing: DATABASE_URL is set and does not point at localhost/cyber-pg" >&2; exit 1 ;;
  esac
fi
if ! docker inspect cyber-pg >/dev/null 2>&1; then
  echo "refusing: local docker container 'cyber-pg' not found" >&2
  exit 1
fi

PG="docker exec -i cyber-pg psql -U postgres -v ON_ERROR_STOP=1 -q"
OLD_REF=${OLD_REF:-main}
TMP=$(mktemp -d)
for db in mig_old mig_new; do $PG -d postgres -c "DROP DATABASE IF EXISTS $db" -c "CREATE DATABASE $db"; done

# old schema + demo data
git show "$OLD_REF:src/db/schema.ts" > "$TMP/schema.ts"
ln -s "$(pwd)/node_modules" "$TMP/node_modules"
npx drizzle-kit generate --schema "$TMP/schema.ts" --dialect postgresql --out "$TMP/old" --name old >/dev/null
sed 's/--> statement-breakpoint//' "$TMP"/old/*.sql | $PG -d mig_old
$PG -d mig_old -c "INSERT INTO \"user\" (id, email, \"approvedAt\") VALUES ('u1','owner@example.com', now()); INSERT INTO organisation (id, \"ownerId\", name) VALUES ('o1','u1','BankX');"
# seed-demo.ts (from OLD_REF) imports '../src/lib/grc/...' relatively; mirror that layout
# so the import resolves. The demo data files under src/lib/grc/*/demo/ are unchanged by
# this task (pure data, no schema.ts dependency), so the current worktree's copies are used.
mkdir -p "$TMP/scripts"
ln -s "$(pwd)/src" "$TMP/src"
git show "$OLD_REF:scripts/seed-demo.ts" > "$TMP/scripts/seed-demo.ts"
npx tsx "$TMP/scripts/seed-demo.ts" --org BankX | $PG -d mig_old
$PG -d mig_old -At -c "select count(*) from control_status; select count(*) from csf_score; select count(*) from risk" > "$TMP/before.txt"
$PG -d mig_old -At -c "select \"controlId\"||':'||status from control_status order by 1" > "$TMP/iso_before.txt"
$PG -d mig_old -At -c "select \"subcategoryId\"||':'||coalesce(current::text,'')||':'||coalesce(target::text,'') from csf_score order by 1" > "$TMP/csf_before.txt"

# migrate
$PG -d mig_old < scripts/migrate-v1.3.sql
$PG -d mig_old -At -c "select count(*) from control_status; select count(*) from csf_score; select count(*) from risk" > "$TMP/after.txt"
diff "$TMP/before.txt" "$TMP/after.txt"
$PG -d mig_old -At -c "select \"controlId\"||':'||status from control_status order by 1" | diff "$TMP/iso_before.txt" -
$PG -d mig_old -At -c "select \"subcategoryId\"||':'||coalesce(current::text,'')||':'||coalesce(target::text,'') from csf_score order by 1" | diff "$TMP/csf_before.txt" -
$PG -d mig_old -At -c "select c.name, f.name, a.framework, a.title from customer c join folder f on f.\"customerId\"=c.id join assessment a on a.\"folderId\"=f.id order by a.framework"

# structure must equal a DB built from the NEW schema
npx drizzle-kit generate --schema src/db/schema.ts --dialect postgresql --out "$TMP/new" --name new >/dev/null
sed 's/--> statement-breakpoint//' "$TMP"/new/*.sql | $PG -d mig_new
dump() { docker exec cyber-pg pg_dump -U postgres --schema-only --no-owner --no-privileges "$1" | grep -vE '^(--|SET |SELECT pg_catalog)' | sed '/^$/d' | sort; }
if diff <(dump mig_old) <(dump mig_new) ; then
  echo "STRUCTURE MATCHES"
else
  echo "raw schema-only dumps differ (likely column order); falling back to information_schema comparison" >&2
  cols() {
    docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
      select table_name, column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, column_name;"
  }
  cons() {
    docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
      select tc.table_name, tc.constraint_type, string_agg(kcu.column_name, ',' order by kcu.ordinal_position)
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public'
      group by tc.table_name, tc.constraint_type, tc.constraint_name
      order by tc.table_name, tc.constraint_type, 3;"
  }
  fks() {
    docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
      select tc.table_name, kcu.column_name, ccu.table_name as ref_table, ccu.column_name as ref_column, rc.delete_rule
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
      join information_schema.referential_constraints rc on tc.constraint_name = rc.constraint_name and tc.table_schema = rc.constraint_schema
      where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
      order by 1,2,3,4;"
  }
  idx() {
    docker exec -i cyber-pg psql -U postgres -At -d "$1" -c "
      select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname;"
  }
  diff <(cols mig_old) <(cols mig_new) && \
  diff <(cons mig_old) <(cons mig_new) && \
  diff <(fks mig_old) <(fks mig_new) && \
  diff <(idx mig_old) <(idx mig_new) && \
  echo "STRUCTURE MATCHES (information_schema fallback)"
fi
echo "MIGRATION OK"
