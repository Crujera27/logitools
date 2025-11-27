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
--     Website: https://crujera.net

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

CREATE TABLE IF NOT EXISTS ai_trigger_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    pattern VARCHAR(1000) NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

INSERT IGNORE INTO ai_trigger_patterns (category, pattern, description) VALUES
('violence', '\\b(kill|murder|attack|bomb|shoot|stab|hurt|harm|die|death|execute|assassinate|slaughter|massacre|torture|strangle|suffocate|decapitate|dismember)\\b', 'Palabras relacionadas con violencia física'),
('violence_threats', '\\b(threat|threaten|gonna kill|will kill|i will hurt|going to hurt|beat you|fight you|destroy you|end you)\\b', 'Amenazas de violencia'),
('hate_speech', '\\b(hate|racist|sexist|nazi|n[i1]gg[ae3]r?|f[a4]g+[o0]?t?|retard|spic|chink|wetback|beaner|kike|tranny|dyke)\\b', 'Insultos y discurso de odio'),
('discrimination', '\\b(all (women|men|blacks|whites|jews|muslims|gays) (are|should)|go back to|deport all|gas the|exterminate)\\b', 'Discriminación y generalizaciones'),
('nsfw_explicit', '\\b(nude|nudes|porn|porno|pornography|xxx|hentai|rule34|onlyfans leak)\\b', 'Contenido explícito NSFW'),
('nsfw_sexual', '\\b(sex|dick|cock|pussy|penis|vagina|blowjob|handjob|cumshot|creampie|gangbang|orgy|anal|masturbat)\\b', 'Términos sexuales explícitos'),
('nsfw_solicitation', '\\b(send nudes|show me your|wanna see my|trade pics|exchange photos|dm me pics)\\b', 'Solicitud de contenido NSFW'),
('hacking', '\\b(hack|hacker|hacking|crack|cracking|exploit|ddos|dos attack|dox|doxxing|leak|leaked|breach|breached|malware|trojan|keylogger|ransomware|phishing)\\b', 'Hacking y ciberseguridad'),
('scam_fraud', '\\b(scam|scammer|fraud|fraudulent|steal|robbery|rob you|free nitro|gift card|claim your prize|you won|inheritance|nigerian prince|crypto giveaway)\\b', 'Estafas y fraude'),
('self_harm', '\\b(suicide|suicidal|kill myself|end my life|want to die|selfharm|self-harm|cutting myself|hurt myself|overdose|hang myself|jump off)\\b', 'Autolesión y suicidio'),
('drugs_hard', '\\b(cocaine|heroin|meth|methamphetamine|fentanyl|crack|lsd|acid|ecstasy|mdma|ketamine|pcp|dmt)\\b', 'Drogas duras'),
('drugs_soft', '\\b(weed|marijuana|cannabis|420|blunt|joint|bong|edibles|thc|cbd|stoner)\\b', 'Drogas blandas'),
('drugs_dealing', '\\b(selling|sell you|buy some|dealer|plug|connect|score some|where to get|hook you up)\\b', 'Venta de drogas'),
('weapons', '\\b(gun|firearm|rifle|pistol|shotgun|ak-?47|ar-?15|ammunition|ammo|bomb|explosive|grenade|molotov|how to make a)\\b', 'Armas y explosivos'),
('personal_info', '\\b(ssn|social security|credit card|card number|cvv|bank account|routing number|password|login credentials|home address|where do you live|your address)\\b', 'Información personal sensible'),
('doxxing', '\\b(dox|doxx|expose|real name is|lives at|phone number is|found your|leaked your)\\b', 'Doxxing e información privada'),
('spam_promo', '\\b(free discord nitro|claim now|limited time|act fast|click here|bit\\.ly|tinyurl|discord\\.gift|steamnity|stearncommunity)\\b', 'Spam y promociones falsas'),
('raid_related', '\\b(raid this|lets raid|nuke the server|mass report|spam this|flood the chat|crash the)\\b', 'Raids y ataques coordinados'),
('grooming', '\\b(how old are you|are you alone|dont tell your parents|our secret|between us|send me a pic|video call me|meet up|come over)\\b', 'Posible grooming'),
('extremism', '\\b(jihad|infidel|crusade|race war|white power|black power|antifa|proud boys|boogaloo|accelerat)\\b', 'Extremismo y radicalización'),
('misinformation', '\\b(fake news|plandemic|5g causes|microchip|bill gates|deep state|qanon|stolen election|hoax|wake up sheeple)\\b', 'Desinformación');
