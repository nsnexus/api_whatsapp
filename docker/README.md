# Evolution Go - Docker Setup

Este diretório contém a configuração oficial e otimizada para rodar a **Evolution Go** (`evolutionapi/evolution-go`) e seu banco PostgreSQL dedicado em qualquer VPS ou ambiente local.

## 🚀 Como Executar

### 1. Preparar o arquivo .env
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Abra o `.env` e configure sua `GLOBAL_API_KEY` (uma senha forte para proteger a API).

### 2. Iniciar os Containers
```bash
docker compose up -d
```

### 3. Verificar se está rodando
```bash
docker compose ps
docker compose logs -f evolution_go
```

Acesse no navegador:
`http://SEU_IP:8080/manager/login` ou teste com `curl`:
```bash
curl -H "apikey: SUA_GLOBAL_API_KEY" http://localhost:8080/instance/fetchInstances
```

---

## 🔒 Na VPS (Produção)
Para expor a Evolution Go de forma segura na nuvem sem precisar abrir portas inseguras nem configurar Nginx manual, recomendamos usar o **Cloudflare Tunnel (cloudflared)**:
```bash
# Na VPS:
cloudflared tunnel run --url http://localhost:8080 seu-tunel
```
Dessa forma, sua Evolution Go responderá direto em `https://evolution.seudominio.com.br` com SSL automático e proteção contra ataques.
