-- ============================================================
-- Migration: 008_security.sql
-- Adiciona estruturas necessárias para o módulo de segurança:
--  - refresh_tokens: rotação de refresh token (login persistente seguro)
--  - login_attempts: lockout contra força bruta
--  - users.token_version: invalida tokens antigos em troca de senha
--  - users.password: permite NULL para usuários de social login
--  - index em reset_token para forgot/reset password rápido
-- ============================================================

-- Tabela de refresh tokens (login persistente com possibilidade de revogação)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,           -- hash sha256 do refresh token (nunca guardar o token cru)
    expires_at  DATETIME NOT NULL,
    revoked_at  DATETIME NULL DEFAULT NULL,
    user_agent  VARCHAR(255) NULL,
    ip_address  VARCHAR(45)  NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id    (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de tentativas de login (lockout)
CREATE TABLE IF NOT EXISTS login_attempts (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    identifier  VARCHAR(255) NOT NULL,           -- email + ip combinado (ou só email)
    ip_address  VARCHAR(45)  NULL,
    success     TINYINT(1)   NOT NULL DEFAULT 0,
    attempted_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_identifier (identifier),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coluna token_version no users: incrementada quando senha muda → invalida tokens antigos
-- (executar de forma segura — só adiciona se não existir)
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token_version'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0',
    'SELECT "token_version já existe" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Permitir password = NULL para usuários de social login (Google/Facebook)
-- (sem NULL, o "" atual permitiria login se alguém tentasse hash de string vazia)
SET @nullable := (
    SELECT IS_NULLABLE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
);
SET @sql := IF(@nullable = 'NO',
    'ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL',
    'SELECT "password já é nullable" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Converter senhas vazias existentes em NULL (social login antigo)
UPDATE users SET password = NULL WHERE password = '';

-- Index em reset_token (forgot/reset password vai escalar melhor)
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_reset_token'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE users ADD INDEX idx_reset_token (reset_token)',
    'SELECT "idx_reset_token já existe" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Provider de social login (opcional, mas evita confusão)
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auth_provider'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT "local"',
    'SELECT "auth_provider já existe" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
