# Teste Técnico

Aplicação desenvolvida com Laravel, Inertia.js, React, Vite, Tailwind CSS e MySQL utilizando Docker e Laravel Sail.

O projeto foi desenvolvido buscando uma arquitetura simples, organizada e de fácil manutenção, seguindo as boas práticas do ecossistema Laravel e React.

A aplicação contempla autenticação de usuários, gerenciamento de motoristas e pedidos, persistência de dados em banco MySQL, além de testes automatizados para validação das principais regras de negócio.

## Requisitos

* Docker
* Docker Compose

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Matheus557/teste-tecnico.git
cd teste-tecnico
```

### 2. Crie o arquivo de ambiente

```bash
cp .env.example .env
```

### 3. Configure o usuário do container (Linux / WSL)

```bash
grep -q '^WWWUSER=' .env && sed -i "s/^WWWUSER=.*/WWWUSER=$(id -u)/" .env || echo "WWWUSER=$(id -u)" >> .env

grep -q '^WWWGROUP=' .env && sed -i "s/^WWWGROUP=.*/WWWGROUP=$(id -g)/" .env || echo "WWWGROUP=$(id -g)" >> .env
```

### 4. Instale as dependências PHP

```bash
docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "$(pwd):/app" \
  -w /app \
  composer:2 \
  composer install --ignore-platform-req=php
```

### 5. Suba os containers

```bash
docker compose -f compose.yaml up -d --build
```

### 6. Aguarde a inicialização do banco

```bash
sleep 15
```

### 7. Configure a aplicação

```bash
docker compose -f compose.yaml exec laravel.test php artisan key:generate

docker compose -f compose.yaml exec laravel.test php artisan migrate:fresh --seed
```

### 8. Instale as dependências do frontend

```bash
docker compose -f compose.yaml exec laravel.test npm install
```

### 9. Gere os assets da aplicação

```bash
docker compose -f compose.yaml exec laravel.test npm run build
```

### 10. Limpe os caches

```bash
docker compose -f compose.yaml exec laravel.test php artisan optimize:clear
```

### 11. Execute os testes automatizados

```bash
docker compose -f compose.yaml exec laravel.test php artisan test
```

## Execução

Após a instalação, a aplicação pode ser iniciada com:

```bash
docker compose -f compose.yaml up -d
```

## URLs

* Aplicação: http://localhost
* Login: http://localhost/login
* Dashboard: http://localhost/dashboard

## Usuário de teste

Um usuário é criado automaticamente durante a execução dos seeders.

**E-mail:** [test@example.com](mailto:test@example.com)

**Senha:** password

## Banco de Dados

Para recriar completamente o banco e popular os dados iniciais:

```bash
docker compose -f compose.yaml exec laravel.test php artisan migrate:fresh --seed
```

## Testes

Para executar a suíte de testes:

```bash
docker compose -f compose.yaml exec laravel.test php artisan test
```
