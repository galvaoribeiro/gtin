"""
Script de seed para criar dados iniciais.
=========================================
Cria uma organização, uma API key e um usuário para desenvolvimento.
"""

from sqlalchemy.orm import Session

from app.db.models import Organization, ApiKey, User
from app.core.security import get_password_hash


# API key fixa para desenvolvimento (não use em produção!)
DEV_API_KEY = "dev_test_key_12345678901234567890123456789012"

# Credenciais do usuário de desenvolvimento
DEV_USER_EMAIL = "admin@example.com"
DEV_USER_PASSWORD = "admin123"


def seed_initial_data(db: Session) -> tuple[Organization, ApiKey, User]:
    """
    Cria dados iniciais se não existirem.
    
    Creates:
        - 1 organização "Dev Organization" com plano starter
        - 1 API key ativa associada
        - 1 usuário admin para acesso ao dashboard
        
    Returns:
        Tuple (organization, api_key, user) criados ou existentes.
    """
    # Verificar se já existe uma organização
    existing_org = db.query(Organization).filter(Organization.name == "Dev Organization").first()
    
    if not existing_org:
        # Criar organização
        existing_org = Organization(
            name="Dev Organization",
            plan="basic",
            daily_limit=15,  # Limite do plano basic
        )
        db.add(existing_org)
        db.commit()
        db.refresh(existing_org)
        print(f"[SEED] Organizacao criada: {existing_org.name} (ID: {existing_org.id})")
    else:
        print("[SEED] Organizacao 'Dev Organization' ja existe.")
    
    # Verificar/criar API key
    existing_key = db.query(ApiKey).filter(ApiKey.key == DEV_API_KEY).first()
    if not existing_key:
        existing_key = ApiKey(
            organization_id=existing_org.id,
            key=DEV_API_KEY,
            name="Chave de Desenvolvimento",
            is_active=True,
        )
        db.add(existing_key)
        db.commit()
        db.refresh(existing_key)
        print(f"[SEED] API key de desenvolvimento criada: {DEV_API_KEY[:16]}...")
    else:
        print("[SEED] API key de desenvolvimento ja existe.")
    
    # Verificar/criar usuário
    existing_user = db.query(User).filter(User.email == DEV_USER_EMAIL).first()
    if not existing_user:
        existing_user = User(
            email=DEV_USER_EMAIL,
            hashed_password=get_password_hash(DEV_USER_PASSWORD),
            organization_id=existing_org.id,
            is_active=True,
        )
        db.add(existing_user)
        db.commit()
        db.refresh(existing_user)
        print(f"[SEED] Usuario de desenvolvimento criado: {DEV_USER_EMAIL}")
    else:
        print("[SEED] Usuario de desenvolvimento ja existe.")
    
    return existing_org, existing_key, existing_user


def run_seed():
    """
    Executa o seed diretamente.
    Útil para rodar via linha de comando.
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        org, key, user = seed_initial_data(db)
        print("\n" + "="*50)
        print("DADOS DE DESENVOLVIMENTO:")
        print("="*50)
        print(f"Organização: {org.name}")
        print(f"Plano: {org.plan}")
        print(f"Limite diário: {org.daily_limit}")
        print(f"API Key: {key.key}")
        print("="*50)
        print("\nCredenciais de Login (Dashboard):")
        print(f"Email: {DEV_USER_EMAIL}")
        print(f"Senha: {DEV_USER_PASSWORD}")
        print("="*50)
    finally:
        db.close()


if __name__ == "__main__":
    # Importar e criar tabelas primeiro
    from app.db.session import engine
    from app.db.models import Base
    
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas!")
    
    print("\nExecutando seed...")
    run_seed()

