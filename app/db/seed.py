"""
Script de seed para criar dados iniciais.
=========================================
Cria uma organização e uma API key para desenvolvimento.
"""

from sqlalchemy.orm import Session

from app.db.models import Organization, ApiKey


# API key fixa para desenvolvimento (não use em produção!)
DEV_API_KEY = "dev_test_key_12345678901234567890123456789012"


def seed_initial_data(db: Session) -> tuple[Organization, ApiKey]:
    """
    Cria dados iniciais se não existirem.
    
    Creates:
        - 1 organização "Dev Organization" com plano starter
        - 1 API key ativa associada
        
    Returns:
        Tuple (organization, api_key) criados ou existentes.
    """
    # Verificar se já existe uma organização
    existing_org = db.query(Organization).filter(Organization.name == "Dev Organization").first()
    
    if existing_org:
        print("[SEED] Organizacao 'Dev Organization' ja existe.")
        
        # Verificar se existe a API key de desenvolvimento
        existing_key = db.query(ApiKey).filter(ApiKey.key == DEV_API_KEY).first()
        if existing_key:
            print("[SEED] API key de desenvolvimento ja existe.")
            return existing_org, existing_key
        
        # Criar API key se não existir
        api_key = ApiKey(
            organization_id=existing_org.id,
            key=DEV_API_KEY,
            is_active=True,
        )
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        print(f"[SEED] API key de desenvolvimento criada: {DEV_API_KEY[:16]}...")
        return existing_org, api_key
    
    # Criar organização
    organization = Organization(
        name="Dev Organization",
        plan="starter",
        daily_limit=1000,  # Limite alto para desenvolvimento
    )
    db.add(organization)
    db.commit()
    db.refresh(organization)
    print(f"[SEED] Organizacao criada: {organization.name} (ID: {organization.id})")
    
    # Criar API key
    api_key = ApiKey(
        organization_id=organization.id,
        key=DEV_API_KEY,
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    print(f"[SEED] API key criada: {DEV_API_KEY[:16]}...")
    
    return organization, api_key


def run_seed():
    """
    Executa o seed diretamente.
    Útil para rodar via linha de comando.
    """
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        org, key = seed_initial_data(db)
        print("\n" + "="*50)
        print("DADOS DE DESENVOLVIMENTO:")
        print("="*50)
        print(f"Organização: {org.name}")
        print(f"Plano: {org.plan}")
        print(f"Limite diário: {org.daily_limit}")
        print(f"API Key: {key.key}")
        print("="*50)
        print("\nAdicione ao .env.local do frontend:")
        print(f"NEXT_PUBLIC_API_KEY={key.key}")
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

