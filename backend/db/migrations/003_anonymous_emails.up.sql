-- Анонимные письма.
--
-- Номер 003, а не 002 как в ветке feat/anonymous-message: в этой ветке 002 уже
-- занята 002_add_encryption. golang-migrate идёт по возрастанию версии, так что
-- на уже задеплоенной базе (version = 2) миграция применится штатно.

-- Опция в профиле: принимать ли анонимные письма.
-- DEFAULT false — безопасный дефолт: никто не получает анонимку без явного
-- согласия. Существующие пользователи получают false, то есть поведение
-- системы до миграции (анонимок нет вообще) сохраняется в точности.
ALTER TABLE users
    ADD COLUMN accept_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Флаг анонимности живёт на самом письме, а не на user_emails, потому что
-- свойство принадлежит сообщению, а не паре (user, email).
-- Автоматически распространяется и на черновики (is_draft = true).
ALTER TABLE emails
    ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Тред для ответов на анонимные письма: получатель отвечает, не зная адреса
-- автора, поэтому связь с оригиналом хранится на сервере.
-- ON DELETE SET NULL: удаление родителя не должно каскадом сносить ответы.
ALTER TABLE emails
    ADD COLUMN parent_email_id BIGINT NULL REFERENCES emails(id) ON DELETE SET NULL;

CREATE INDEX idx_emails_parent_email_id
    ON emails(parent_email_id)
    WHERE parent_email_id IS NOT NULL;

-- Инвариант: анонимное письмо ОБЯЗАНО иметь внутреннего отправителя.
-- Без sender_id некому "прятаться" — деанонимизировать было бы нечего,
-- и Reply не смог бы найти автора оригинала.
-- NOT VALID + VALIDATE двумя шагами: на большой таблице так не берётся
-- ACCESS EXCLUSIVE на время полного скана. Существующие строки заведомо
-- проходят проверку (is_anonymous = false у всех), но валидируем явно.
ALTER TABLE emails
    ADD CONSTRAINT anonymous_requires_internal_sender
        CHECK (NOT is_anonymous OR sender_id IS NOT NULL) NOT VALID;

ALTER TABLE emails
    VALIDATE CONSTRAINT anonymous_requires_internal_sender;
