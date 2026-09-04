# S.Mail – почтовый клиент

![Version](https://img.shields.io/badge/version-1.4.1-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

> **Link**: [e-smail.ru](e-smail.ru)

## О проекте

Полноценный почтовый веб-клиент с поддержкой папок, работы с вложениями, анонимными письмами.

Изначально проект был учебным заданием курса "Web development" от VK Education.
После успешной защиты проекта было решено продолжить разработку и превратить его в полноценный проект, которым можно пользоваться.

**Ключевые фичи:**

- Полноценная двусторонняя коммуникация с внешними сервисами
- Папки, вложения
- Адаптивный интерфейс (desktop / mobile), темная тема
- Русский и английский язык

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

#### **1. Переменные окружения (.env)**

Заполните файл `.env.example` своими данными и переименуйте в `.env`

#### **2. Запуск сервиса**

```bash
docker-compose up -d
```

Сервис будет доступен по адресу http://localhost:3000

### Вариант 2: Ручная установка

#### **1. Переменные окружения (.env)**

Заполните файл `.env.example` своими данными

#### **2. Запуск сервиса**

```bash
git clone ...

cd frontend && npm install && npm run build

cd ../backend && make docker-up
```

## Контакты

**Максим Шаркевич (@SharkyJunior):**

- Telegram: @SharkyJunior
- Email: sharkevich.maxim@gmail.com

**Иван Горбань (@johanngorban):**

- Telegram: @johanngorban
