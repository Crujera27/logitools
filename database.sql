-- --------------------------------------------------------
/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify  
    it under the terms of the GNU Affero General Public License as published by  
    the Free Software Foundation, either version 3 of the License, or  
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,  
    but WITHOUT ANY WARRANTY; without even the implied warranty of  
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License  
    along with this program. If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/
-- SQL FOR LOGITOOLS BETA v.4.0.0 (18/11/20224)
--
--

-- Dumping structure for table s84_logitoolsUSA.disciplinary_records
CREATE TABLE IF NOT EXISTS `disciplinary_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `offender_discord_id` int(255) NOT NULL,
  `issuer_discord_id` int(255) NOT NULL,
  `issue_date` date NOT NULL DEFAULT current_timestamp(),
  `file_name` int(11) NOT NULL,
  `file_internalname` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.filter_patterns
CREATE TABLE IF NOT EXISTS `filter_patterns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pattern` varchar(255) NOT NULL,
  `type` enum('regex','phrase','domain','url') NOT NULL,
  `severity` enum('mild','middle','severe','ban') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.filter_allowlist
CREATE TABLE IF NOT EXISTS `filter_allowlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.moderation_bypass
CREATE TABLE IF NOT EXISTS `moderation_bypass` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` varchar(20) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.punishment_history
CREATE TABLE IF NOT EXISTS `punishment_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(255) NOT NULL,
  `punishment_type` enum('warn_mild','warn_middle','warn_severe','timeout','ban') NOT NULL,
  `punishment_reason` text NOT NULL,
  `issue_date` datetime NOT NULL,
  `punishment_issuer` varchar(255) NOT NULL,
  `expired` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_discord_id` (`discord_id`)
) ENGINE=InnoDB AUTO_INCREMENT=534 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.resources
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `link` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `originalname` text CHARACTER SET utf16 COLLATE utf16_general_ci NOT NULL,
  `createdby` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `name` varchar(50) NOT NULL,
  `value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.tickets
CREATE TABLE IF NOT EXISTS `tickets` (
  `user_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `ticket_status` varchar(20) NOT NULL,
  `ticket_responses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`ticket_responses`)),
  PRIMARY KEY (`user_id`,`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table s84_logitoolsUSA.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `discriminator` varchar(4) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `avatar_uuid` varchar(255) DEFAULT NULL,
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `isStaff` tinyint(1) NOT NULL DEFAULT 0,
  `staffrank` text CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `adminVerifyStatus` enum('unverified','progress','locked','verified') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'unverified',
  `hideInStaff` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `discord_id` varchar(255) NOT NULL,
  `language` varchar(10) DEFAULT 'en',
  `compact_mode` tinyint(1) DEFAULT 0,
  `email_notifications` tinyint(1) DEFAULT 1,
  `discord_notifications` tinyint(1) DEFAULT 1,
  `hide_profile` tinyint(1) DEFAULT 0,
  `hide_stats` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`discord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `automod_settings` (
  `setting_name` varchar(50) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_description` text,
  `category` enum('filters','limits','actions','general') NOT NULL,
  `setting_type` enum('boolean','number','text','json') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `automod_settings` 
(`setting_name`, `setting_value`, `setting_description`, `category`, `setting_type`) VALUES
('filter_enabled', 'true', 'Activar/desactivar el sistema de automod', 'general', 'boolean'),
('max_mentions', '5', 'Máximo de menciones permitidas por mensaje', 'limits', 'number'),
('max_lines', '10', 'Máximo de líneas permitidas por mensaje', 'limits', 'number'),
('max_duplicates', '3', 'Máximo de mensajes duplicados permitidos', 'limits', 'number'),
('warn_threshold', '3', 'Número de advertencias antes de tomar acción', 'actions', 'number'),
('timeout_duration', '300', 'Duración del timeout en segundos', 'actions', 'number'),
('exempt_roles', '[]', 'IDs de roles exentos del automod', 'general', 'json'),
('blocked_words', '[]', 'Lista de palabras bloqueadas', 'filters', 'json'),
('url_allowlist', '[]', 'Lista blanca de URLs permitidas', 'filters', 'json'),
('spam_sensitivity', '3', 'Nivel de sensibilidad anti-spam (1-5)', 'limits', 'number'),
('caps_percentage', '70', 'Porcentaje máximo de mayúsculas permitido', 'limits', 'number'),
('enable_antiflood', 'true', 'Activar protección contra flood', 'filters', 'boolean'),
('flood_time_window', '5', 'Ventana de tiempo para detectar flood (segundos)', 'limits', 'number'),
('flood_message_count', '5', 'Número de mensajes para detectar flood', 'limits', 'number'),
('punishment_escalation', 'true', 'Escalar castigos por infracciones repetidas', 'actions', 'boolean');