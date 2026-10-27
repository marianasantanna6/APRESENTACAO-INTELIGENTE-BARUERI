"""Verifica se o banco está acessível e mostra quantas coletas foram salvas."""
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1]
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from services.supabase_service import verify_connection

if __name__ == "__main__":
    result = verify_connection()
    print("Conexão com Supabase OK.")
    print(f"Coletas salvas: {result['total']}")
    print(f"Com embedding: {result['with_embedding']}")
    print(f"Pendentes de embedding: {result['pending']}")
