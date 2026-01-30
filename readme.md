# GTIN→NCM Data Platform — Especificação Técnica (Nova Versão) + Wireframes

> **Objetivo:**  **plataforma de dados cadastrais e informação de produtos** baseada em GTIN, fornecendo consulta individual e **API de alto desempenho** para empresas que desejam atualizar cadastros, validar informações de catálogo e enriquecer bases internas.

---

# 1) Visão Geral

- **Escopo**: serviço de consulta confiável de dados ligados ao GTIN: NCM, CEST, descrição, marca, peso, origem, data de atualização, etc.&#x20;
- **Proposta de valor**: substituir processos manuais de catalogação, reduzir inconsistência de cadastros, acelerar integração de SKU, criar base única de referência.
- **Canais**:
  - **Painel Web** (consulta unitária e gerenciamento de API keys)
  - **API** (consulta unitária, batch síncrono e, opcionalmente, assíncrono)

---

# 2) Funcionalidades do MVP

## 2.1 Core

1. **Consulta individual de GTIN** via painel.
2. **Consulta individual via API**.
3. **Consulta em lote via API** (até 100 GTINs por chamada síncrona — *batch size = 100*).
4. **Gestão de API Keys** (criar/renovar/revogar).
5. **Dashboard de uso** (chamadas realizadas, limites, status do plano).
6. **Exibição completa dos metadados** do produto (sem imagens nesta versão).

## 2.2 Posterior / opcional

- Lote assíncrono (para milhões de GTINs).
- Relatórios por NCM (listagem de GTINs por família).
- Webhooks de limite de uso.

---

# 3) Modelo de Dados (PostgreSQL)

## 3.1 Tabela `products`

Armazena os dados confiáveis carregados da sua base.

**Campos sugeridos:**

- `gtin` (PK)
- `gtin_type`
- `brand`
- `product_name`
- `origin_country` (ex.: BR)
- `ncm` (8 dígitos)
- `cest` (jsonb: lista com 0–3 CESTs)
- `gross_weight_value` (numeric)
- `gross_weight_unit`
- `dsit_timestamp` (timestamp)
- `updated_at`

**Observações:** removemos `destination_country` conforme sua decisão inicial e não persistimos/retornamos `image_url`.

## 3.2 Outras tabelas

- `organizations`: planos e limites.
- `api_keys`: chave hash, status, limites.
- `usage_daily`: métricas de consumo por dia.
- `search_tokens` (opcional): suporte para busca parcial por marca / product\_name no painel.

Índices: PK em `gtin`, índice em `ncm`, GIN em `cest` e em `search_tokens` se existirem.

---

# 4) API — Especificação (v1)

Base URL: `https://api.sua-plataforma.com/v1`

> **Nota rápida sobre terminologia:** quando eu escrevi “**API (contratos recomendados)**” antes, quis dizer os **contratos de API** — ou seja, a lista de endpoints, métodos HTTP, formatos de requisição e resposta (JSON schema), códigos de erro, headers obrigatórios (ex.: Authorization), limites de taxa e comportamento em casos limites (ex.: paginar, resposta parcial). São as regras que clientes e SDKs seguem para integrar com sua plataforma.

## 4.1 Autenticação

Requer header:

```
Authorization: Bearer <API_KEY>
```

Erros: `401` (ausência), `403` (chave inativa), `429` (limite atingido).

## 4.2 Consulta unitária

**GET** `/gtins/{gtin}`

**Exemplo de Response 200:**

```json
{
  "gtin": "7898708460003",
  "gtin_type": "13",
  "brand": "ZEHN BIER",
  "product_name": "CHOPP PORTER 1 LITRO",
  "origin_country": "BR",
  "ncm": "22030000",
  "ncm_formatted": "2203.00.00",
  "cest": ["0302300"],
  "gross_weight": { "value": 1130.0, "unit": "GRM" },
  "dsit_timestamp": "2024-08-19T00:00:00Z",
  "updated_at": "2025-11-11T00:00:00Z"
}
```

Se `gtin` não existir: `404` com payload `{ "detail": "GTIN not found" }`.

## 4.3 Consulta em lote (síncrono)

**POST** `/gtins:batch`  (até **100** GTINs por chamada)

**Request:**

```json
{ "gtins": ["7898708460003", "7898708460010", "7898638071478"] }
```

**Exemplo de Response:**

```json
{
  "results": [
    { "gtin": "7898708460003", "ok": true, "data": { ... } },
    { "gtin": "7898708460010", "ok": true, "data": { ... } },
    { "gtin": "7898638071478", "ok": true, "data": { ... } }
  ],
  "not_found": []
}
```

## 4.4 Limites e planos&#x20;

**Risco de data harvesting** mitigado com limites menores e controle de uso:

- **Starter**: **200 consultas (GTINs) por dia**, *batch size* máximo = 100; rate limit 10 req/min.
- **Pro**: **1000 consultas por dia**, *batch size* máximo = 100; rate limit 30 req/min.
- **Enterprise**: contrato custom (IP allowlist, SLAs, bulk assíncrono).

Observação: "consultas por dia" significa consumo de GTINs — uma chamada batch com 50 GTINs conta 50 para o total diário.

---

# 5) Painel Web — **Frontend atualizado para Next.js/React**

O painel inicialmente seria implementado com **HTMX/Jinja2**, porém foi decidido migrar o frontend para **Next.js/React**, mantendo o **FastAPI como backend/API**. Essa abordagem oferece maior escalabilidade, UI moderna e separação clara entre frontend e backend.

## 5.1 Stack escolhida

- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- Axios ou fetch para consumo da API
- JWT + cookies ou NextAuth (opcional) para autenticação
- Recharts (gráficos para dashboard)

## 5.2 Rotas previstas (Next.js)

**Landing pública:**

```
/        
/pricing  
/docs     
/sobre    
```

**Painel autenticado:**

```
/app/dashboard
/app/gtins
/app/api-keys
/app/usage
/app/billing
/app/settings
```

## 5.3 Funcionalidades mantidas

- Consulta de GTIN
- Visualização de metadados
- Geração/Revogação de API Keys
- Dashboard de uso (com gráficos)
- Layout responsivo e moderno

---

# 6) Wireframes (Low‑fi)

(sem alterações conceituais — painel continuará mostrando as informações; imagens removidas dos layouts)

---

# 7) Arquitetura (nova)

- **FastAPI** como backend/API principal.
- **Next.js/React** como frontend separado (painel + landing page).
- **PostgreSQL** (dados do GTIN + planos + keys + usage).
- **Redis** para rate limit.

Sem workers RQ no MVP. Bulk assíncrono somente para Enterprise.

## 7.1 Rate Limits (Redis)

A API implementa rate limits por plano usando Redis:

### Endpoints Autenticados (por organização)

| Endpoint | Plano | Limite |
|----------|-------|--------|
| `/{gtin}`, `/batch` | starter | 60 req/min |
| `/{gtin}`, `/batch` | pro | 90 req/min |
| `/{gtin}`, `/batch` | advanced | 120 req/min |
| `/search` | starter | 1 req/6s |
| `/search` | pro | 1 req/4s |
| `/search` | advanced | 1 req/2s |

### Endpoint Público (por IP)

| Endpoint | Limite |
|----------|--------|
| `/v1/public/gtins/{gtin}` | 20 req/dia (reset 00:00 BRT) + 1 req/5s |

**Documentação completa:** [docs/RATE_LIMITS.md](docs/RATE_LIMITS.md)

## 7.2 Desenvolvimento Local (Docker)

Para rodar Redis localmente:

```bash
# Subir Redis
docker-compose up -d redis

# Verificar se está rodando
docker-compose ps
```

Configure no `.env`:

```bash
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=true
```

## 7.3 Deploy no Railway

1. Adicione um serviço **Redis** no projeto Railway
2. Railway injeta automaticamente `REDIS_URL`
3. Conecte o Redis ao seu backend nas variáveis de ambiente

---

# 8) Segurança, anti‑harvesting e LGPD

Medidas recomendadas para evitar que clientes façam data harvesting e se tornem concorrentes:

1. **Limites diários agressivos** (já aplicados: Starter 200/dia, Pro 1000/dia).
2. **Batch size controlado**: max 100 por chamada.
3. **Rate limiting** por chave (requests/min) e por IP (Redis token bucket).
4. **Monitoração e alertas**: detectar padrões (picos, requests contínuos, scraping).
5. **Política de uso**: TOS claro proibindo re‑distribuição e scraping; penalidades e revogação da chave.


Essas medidas combinadas reduzem muito o risco de um cliente replicar sua base com volume limitado de consultas.

---

# 9) ETL do CSV Mestre (diretrizes)

O ETL importa seu CSV para `products` aplicando as seguintes regras:

- **Leitura**: CSV com `;` separado; cabeçalho conhecido.
- **Limpeza**: trim, remoção de linhas duplicadas, normalização de maiúsculas/minúsculas.
- **CEST**: agrupar `CEST_1..CEST_3` em array `cest` (descartar vazios).
- **Timestamps**: parse do `DSIT` para `dsit_timestamp` ISO.
- **GTIN**: validar dígito verificador; rejeitar ou logar inválidos.
- **Peso**: transformar `PESOB` em `gross_weight_value` (numeric) e `UNIDPESOB` em `gross_weight_unit`.
- **Versionamento**: atualizar `updated_at` e manter `source_hash` para detectar alterações na fonte.

O script pode: rodar manualmente, via cron, ou ser executado como job único em deploy.

---

# 10) Posicionamento comercial & pricing refinado

## 10.1 Posicionamento

- **Oferta**: "Fonte única e confiável de dados fiscais e cadastrais por GTIN" — foco em contabilidade, e‑commerce, ERPs e marketplaces.
- **Diferenciais**: dados curados (não inferidos), latência baixa, contrato comercial para clientes que precisam de confiança legal.
- **Go‑to‑market**: piloto com 2–3 contabilidades/marketplaces; criar integrações simples (webhooks, exemplo de script de sincronização).

## 10.2 Pricing (refinado e defensivo)

### Planos e Valores

| Plano | Preço | Consultas/Dia | Features |
|-------|-------|---------------|----------|
| **Basic** | Grátis | 15 | Acesso público limitado |
| **Starter** | R$ 249,90/mês | 1.000 | API Key dedicada, 10 req/min |
| **Pro** | R$ 399,90/mês | 5.000 | Batch processing, 30 req/min |
| **Enterprise** | R$ 899,90/mês | 50.000 | SLA garantido, gerente dedicado |

### Pagamentos via Stripe

A plataforma utiliza **Stripe** para processar pagamentos recorrentes:

- ✅ Checkout integrado para upgrade de planos
- ✅ Portal de cobrança para gerenciar assinaturas
- ✅ Webhooks para sincronização automática de status
- ✅ Suporte a cartões de crédito internacionais
- ✅ Faturas e recibos automáticos

**Documentação completa:** [docs/STRIPE_INTEGRATION.md](docs/STRIPE_INTEGRATION.md)

---

# 11) Critérios de Aceite do MVP (atualizados)

- Consulta unitária ≤ 300–400ms p95.
- Batch síncrono até 100 GTINs por chamada.
- Planos respeitam os limites diários (Starter 200/dia; Pro 1000/dia).
- Painel funcional com consulta, keys e métricas de uso.
- API documentada (OpenAPI) e SDKs mínimos.

