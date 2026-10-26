"""Gera os vetores que ficaram pendentes antes da chave de IA estar disponível."""
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from services.supabase_service import backfill_pending_embeddings

if __name__ == "__main__":
    updated = backfill_pending_embeddings()
    print(f"Embeddings gerados: {updated}")
