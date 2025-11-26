/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024 Ángel Crujera (me@crujera.net)

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
    Website: https://crujera.net

*/


import executeQuery, { pool } from './mysql.mjs';
import log from './log.mjs';
import sendLog from './discordlog.mjs'

// Import sendLog using dynamic import and await
async function applyPunishment(discordId, punishmentType, punishmentReason, punishmentIssuer) {
    try {
        let expirationDate;
        if (punishmentType === 'warn_mild') {
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (punishmentType === 'warn_middle') {
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 3);
        } else if (punishmentType === 'warn_severe') {
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 6);
        } else {
            expirationDate = null;
        }

        const sql = `
            INSERT INTO punishment_history (discord_id, punishment_type, punishment_reason, punishment_issuer, issue_date)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await executeQuery(sql, [discordId, punishmentType, punishmentReason, punishmentIssuer]);
        await sendLog(punishmentType, punishmentIssuer, discordId, punishmentReason);

        return { success: true, message: 'Sanción aplicada con éxito.' };
    } catch (error) {
        log('Error al aplicar la sanción: ' + error, 'error');
        return { success: false, message: 'Error al aplicar la sanción.' };
    }
}

async function updateExpirationStatus() {
    try {
        const sql = `
        UPDATE punishment_history
        SET expired = CASE
            WHEN punishment_type = 'warn_mild' AND DATE_ADD(issue_date, INTERVAL 1 MONTH) < NOW() THEN 1
            WHEN punishment_type = 'warn_middle' AND DATE_ADD(issue_date, INTERVAL 3 MONTH) < NOW() THEN 1
            WHEN punishment_type = 'warn_severe' AND DATE_ADD(issue_date, INTERVAL 6 MONTH) < NOW() THEN 1
            ELSE 0
        END
        WHERE expired = 0
    `;
        await executeQuery(sql);
        log('El estado de vencimiento de las sanciones se actualizó exitosamente.', 'done');
        return { success: true, message: 'Expiration status updated successfully.' };
    } catch (error) {
        log('Error al intentar actualizar los estados de vencimiento de las sanciones: ' + error, 'error');
        return { success: false, message: 'Error updating expiration status.' };
    }
}

async function getUserVigentPunishments(discordId) {
    try {
        const sql = `SELECT * FROM punishment_history WHERE discord_id = ? AND expired = '0'`;
        const punishments = await executeQuery(sql, [discordId]);
        return { success: true, punishments };
    } catch (error) {
        log('Error retrieving user punishments: ' + error, 'error');
        return { success: false, message: 'Error retrieving user punishments.' };
    }
}

async function updateExpirationStatusByUserAndType(discordId, punishmentType) {
    try {
        const sql = `
            UPDATE punishment_history
            SET expired = 1
            WHERE discord_id = ? AND punishment_type = ? AND expired = 0
        `;
        await executeQuery(sql, [discordId, punishmentType]);
        log(`Expiration status for ${punishmentType} punishments of user ${discordId} updated successfully.`, 'done');
        return { success: true, message: `Expiration status for ${punishmentType} punishments of user ${discordId} updated successfully.` };
    } catch (error) {
        log(`Error updating expiration status for ${punishmentType} punishments of user ${discordId}: ${error}`, 'error');
        return { success: false, message: `Error updating expiration status for ${punishmentType} punishments of user ${discordId}.` };
    }
}

export { applyPunishment, updateExpirationStatus, getUserVigentPunishments, updateExpirationStatusByUserAndType };
