/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright © 2024 Crujera27 y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/Crujera27/
    Web: https://crujera.galnod.com
    Licencia del proyecto: MIT

*/
import executeQuery, { pool } from './mysql.mjs';
import log from './log.mjs'

/**
 * Stores a punishment in the database
 *
 * @param {number} discordId - Discord ID of the offender.
 * @param {string} punishmentType -  Punishment type (warn_mild, warn_middle, warn_severe, timeout, ban)
 * @param {text} punishmentReason - Reason to store in the DB for the punishment.
 * @param {number} punishmentIssuer - Discord ID of the staff member who issued the punishment.
 * @returns {bolean} - The result of the operation: true = successful, false = unsuccessful
 */

const applyPunishment = async (discordId, punishmentType, punishmentReason, punishmentIssuer) => {
    try {
        let expirationDate;
        if (punishmentType === 'warn_mild') {
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (punishmentType === 'warn_middle') {
            expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + 3);
        } else if (punishmentType === 'warn_severe') {
            expirationDate = null;
        } else {
            expirationDate = null;
        }

        const sql = `
            INSERT INTO punishment_history (discord_id, punishment_type, punishment_reason, punishment_issuer, issue_date)
            VALUES (?, ?, ?, ?, NOW())
        `;

        await executeQuery(sql, [discordId, punishmentType, punishmentReason, punishmentIssuer]);

        return { success: true, message: 'Sanción aplicada con éxito.' };
    } catch (error) {
        log('Error al aplicar la sanción:'+error, 'error');
        return { success: false, message: 'Error al aplicar la sanción.' };
    }
};

const updateExpirationStatus = async () => {
    try {
        const sql = `
        UPDATE punishment_history
        SET expired = CASE
            WHEN punishment_type = 'warn_severe' THEN 0
            WHEN punishment_type = 'warn_mild' AND DATE_ADD(issue_date, INTERVAL 1 MONTH) < NOW() THEN 1
            WHEN punishment_type = 'warn_middle' AND DATE_ADD(issue_date, INTERVAL 3 MONTH) < NOW() THEN 1
            ELSE 0
        END
        WHERE expired = 0
    `;
    

        await executeQuery(sql);

        log('El estado de vencimiento de las sanciones se actualizó exitosamente.', 'done');

        return { success: true, message: 'Expiration status updated successfully.' };
    } catch (error) {
        log('Error al intentar actualizar los estados de vencimiento de las sanciones:'+error, 'error');
        return { success: false, message: 'Error updating expiration status.' };
    }
};

/**
 * Get a user's punishments from the database
 *
 * @param {number} discordId - Discord ID of the user.
 * @returns {object} - Object containing the user's punishments or an error message.
 */
const getUserVigentPunishments = async (discordId) => {
    try {
        const sql = `SELECT * FROM punishment_history WHERE discord_id = ? AND expired = '0'`;
        const punishments = await executeQuery(sql, [discordId]);
        
        return { success: true, punishments };
    } catch (error) {
        log('Error retrieving user punishments: ' + error, 'error');
        return { success: false, message: 'Error retrieving user punishments.' };
    }
};

/**
 * Update expiration status of punishments for a specific user and punishment type
 *
 * @param {number} discordId - Discord ID of the user.
 * @param {string} punishmentType - Type of punishment to update expiration status for.
 * @returns {object} - Object indicating the success or failure of the operation.
 */
const updateExpirationStatusByUserAndType = async (discordId, punishmentType) => {
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
};


export { applyPunishment, updateExpirationStatus, getUserVigentPunishments, updateExpirationStatusByUserAndType };