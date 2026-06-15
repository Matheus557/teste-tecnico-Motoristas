# Teste Técnico - Gestão de Motoristas e Pedidos

Aplicação desenvolvida como solução para o desafio técnico proposto, utilizando Laravel, Inertia.js, React e MySQL.

O sistema permite o gerenciamento de motoristas e pedidos através de uma interface web integrada, contemplando autenticação de usuários, validações de negócio, persistência de dados e testes automatizados.

O projeto foi desenvolvido priorizando organização, legibilidade e facilidade de execução, utilizando Docker para garantir um ambiente consistente independentemente do sistema operacional utilizado.

---

## Como utilizar

Após concluir a instalação, acesse:

```text
http://localhost
```

O projeto utiliza Laravel Breeze para autenticação.

Na página inicial, clique em **Login** no canto superior direito para acessar o sistema.

### Usuário de teste

Um usuário é criado automaticamente durante a execução dos seeders.

**E-mail:** [test@example.com](mailto:test@example.com)

**Senha:** password

Após o login você será redirecionado para o dashboard da aplicação, onde poderá acessar os módulos de motoristas e pedidos.

---

## Tecnologias Utilizadas

### Backend

* PHP 8.5
* Laravel 13
* Laravel Breeze
* Inertia.js
* MySQL 8
* PHPUnit

### Frontend

* React
* Vite
* Tailwind CSS

### Infraestrutura

* Docker
* Laravel Sail

---

## URLs

* Aplicação: http://localhost
* Login: http://localhost/login
* Dashboard: http://localhost/dashboard

---

## Requisitos

* Docker
* Docker Compose

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Matheus557/teste-tecnico-Motoristas.git
cd teste-tecnico-Motoristas
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

---

## Banco de Dados

Para recriar completamente o banco e popular os dados iniciais:

```bash
docker compose -f compose.yaml exec laravel.test php artisan migrate:fresh --seed
```

---

## Testes

Para executar a suíte de testes:

```bash
docker compose -f compose.yaml exec laravel.test php artisan test
```
