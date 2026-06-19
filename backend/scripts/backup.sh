#!/usr/bin/env bash
# =====================================================================
# Backup automático do banco (RF infra / Sprint 6)
# - Gera um dump comprimido do PostgreSQL
# - Mantém retenção de 90 dias (PRD §3.3)
#
# Uso:
#   DATABASE_URL="postgresql://..." ./backup.sh [diretorio_destino]
#
# Agende com cron (ex.: diário às 2h):
#   0 2 * * * cd /caminho/backend && DATABASE_URL=... ./scripts/backup.sh /backups >> /var/log/gv-backup.log 2>&1
# =====================================================================
set -euo pipefail

DEST="${1:-./backups}"
RETENCAO_DIAS=90

if [ -z "${DATABASE_URL:-}" ]; then
  # tenta carregar do .env
  if [ -f ".env" ]; then
    export "$(grep -E '^DATABASE_URL=' .env | head -1 | sed 's/^/DATABASE_URL=/;s/DATABASE_URL=DATABASE_URL=/DATABASE_URL=/')" 2>/dev/null || true
    DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERRO: defina DATABASE_URL (env ou .env)." >&2
  exit 1
fi

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d_%H%M%S)"
ARQUIVO="$DEST/backup_${STAMP}.sql.gz"

echo "[$(date)] Iniciando backup → $ARQUIVO"
# --no-owner/--no-privileges facilitam restauração em outro ambiente
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$ARQUIVO"
echo "[$(date)] Backup concluído: $(du -h "$ARQUIVO" | cut -f1)"

# Retenção: remove backups com mais de RETENCAO_DIAS
find "$DEST" -name 'backup_*.sql.gz' -type f -mtime +"$RETENCAO_DIAS" -delete
echo "[$(date)] Retenção aplicada (> ${RETENCAO_DIAS} dias removidos)."

# Restauração (referência):
#   gunzip -c backup_AAAAMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
