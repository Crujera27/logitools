-- .____                 .__  __                .__          
-- |    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
-- |    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
-- |    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
-- |_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
--         \/    /_____/                                  \/ 
--                         
--         
--     Copyright (C) 2024 Ángel Crujera (me@crujera.net)
-- 
--     This program is free software: you can redistribute it and/or modify  
--     it under the terms of the GNU Affero General Public License as published by  
--     the Free Software Foundation, either version 3 of the License, or  
--     (at your option) any later version.
-- 
--     This program is distributed in the hope that it will be useful,  
--     but WITHOUT ANY WARRANTY; without even the implied warranty of  
--     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
--     GNU Affero General Public License for more details.
-- 
--     You should have received a copy of the GNU Affero General Public License  
--     along with this program. If not, see <https://www.gnu.org/licenses/>.
--     
--     GitHub: https://github.com/Crujera27/
--     Website: https://crujera.galnod.com

-- Database schema update for AI moderation system

-- Add AI moderation settings if not exists
INSERT IGNORE INTO settings (name, value, description) VALUES 
('ai_moderation_enabled', '1', 'Enable or disable AI-powered moderation'),
('ai_context_messages', '5', 'Number of recent messages to send to AI for context'),
('ai_context_time_window', '300000', 'Time window in milliseconds for message context');

-- Create table for AI moderation logs
CREATE TABLE IF NOT EXISTS ai_moderation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    ai_decision VARCHAR(50) NOT NULL,
    ai_category VARCHAR(10) NULL,
    punishment_applied VARCHAR(50) NULL,
    confidence_score DECIMAL(5,2) NULL,
    context_messages JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_ai_decision (ai_decision),
    INDEX idx_created_at (created_at)
);

-- Create table for AI moderation bypass roles (if not exists)
CREATE TABLE IF NOT EXISTS moderation_bypass (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id VARCHAR(255) NOT NULL UNIQUE,
    role_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default bypass roles (adjust role IDs as needed)
INSERT IGNORE INTO moderation_bypass (role_id, role_name) VALUES 
('ADMIN_ROLE_ID', 'Administrator'),
('MOD_ROLE_ID', 'Moderator'),
('STAFF_ROLE_ID', 'Staff');

-- Create table for filter patterns (if not exists)
CREATE TABLE IF NOT EXISTS filter_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pattern VARCHAR(1000) NOT NULL,
    type ENUM('regex', 'phrase', 'domain') NOT NULL,
    severity ENUM('mild', 'middle', 'severe', 'ban') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create table for filter allowlist (if not exists)
CREATE TABLE IF NOT EXISTS filter_allowlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default allowlisted domains
INSERT IGNORE INTO filter_allowlist (domain) VALUES 
('discord.com'),
('github.com'),
('youtube.com'),
('logikk.crujera.net');

-- Update existing settings if they exist
UPDATE settings SET value = '1' WHERE name = 'ai_moderation_enabled';
