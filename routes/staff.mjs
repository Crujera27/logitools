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

import express from 'express';
import isAuthenticated from '../middleware/auth.mjs';
import executeQuery, { pool } from '../tools/mysql.mjs';
import { pjson } from '../tools/pjson.mjs';
import isStaff from '../middleware/staff.mjs';
import toml from 'toml';
import fs from 'fs';
import os from 'os'
import log from '../tools/log.mjs';
import sendLog from '../tools/discordlog.mjs'
import { emitTicketUpdate } from '../services/socketProxy.mjs';

const router = express.Router();

router.get('/staff', isAuthenticated, isStaff, async (req, res) => {
    return res.render('staff/index', { user: req.user, version: pjson.version, versionnotes: pjson.relasenotes, appname: pjson.name, osrelase: os.release(), oshostname: os.hostname(), ostype: os.type()});
})
router.get('/staff/punishmentmanager', isAuthenticated, isStaff, async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.render('staff/punishmentmanager', { punishments: [], error: 'userIdMissing', done: req.query.done, notification: false});
    }

    try {
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID del usuario inválida' });
      }
        const results = await executeQuery('SELECT * FROM punishment_history WHERE discord_id = ?', [userId]);
        return res.render('staff/punishmentmanager', { punishments: results, error: null, done: req.query.done, notification: userId });
    } catch (error) {
        log(error, err);
        return res.status(500).render('error', { error : 'HTTP 500 - Internal Server Error'});
    }
});

router.get('/staff/punishmentmanager/revokepunishment', isAuthenticated, isStaff, async (req, res) => {
  const { punishmentId, userId } = req.query;
  if (!userId) {
    return res.status(400).render('error', { error : 'HTTP 400 - Bad request'});
  }
  if (!punishmentId || isNaN(punishmentId)) {
    return res.status(400).render('error', { error : 'HTTP 400 - Bad request'});
  }
  try {
    await sendLog('Registro eliminado', req.user.discord_id, userId, `ID: ${punishmentId}`);
    await executeQuery('DELETE FROM punishment_history WHERE id = ?', [punishmentId]);
    res.redirect(`/staff/punishmentmanager?done=true&userId=${userId}`);
  } catch (error) {
    log(error, 'err');
    return res.status(500).render('error', { error : 'HTTP 500 - Internal Server Error'});
  }
});

router.get('/staff/tickets', isAuthenticated, isStaff, async (req, res) => {
    try {
        const tickets = await executeQuery('SELECT t.*, u.username FROM tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY created_at DESC');
        res.render('staff/tickets', { user: req.user, tickets });
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to load tickets' });
    }
});

router.get('/staff/tickets/data', isAuthenticated, isStaff, async (req, res) => {
    try {
        const tickets = await executeQuery(`
            SELECT t.*, u.username,
                   COUNT(m.message_id) as message_count 
            FROM tickets t 
            LEFT JOIN users u ON t.user_id = u.id 
            LEFT JOIN ticket_messages m ON t.ticket_id = m.ticket_id 
            GROUP BY t.ticket_id, t.created_at, t.status, t.subject, t.user_id, u.username 
            ORDER BY t.created_at DESC`);
        
        res.json({ 
            tickets,
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        log(error, 'err');
        res.status(500).json({ error: 'Failed to load tickets' });
    }
});

router.get('/staff/ticket/:id', isAuthenticated, isStaff, async (req, res) => {
    try {
        const ticket = await executeQuery('SELECT t.*, u.username FROM tickets t LEFT JOIN users u ON t.user_id = u.id WHERE ticket_id = ?', [req.params.id]);
        if (!ticket.length) {
            return res.status(404).render('error', { error: 'Ticket not found' });
        }
        
        const messages = await executeQuery(`
            SELECT m.*, u.username, u.isStaff 
            FROM ticket_messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            WHERE ticket_id = ? 
            ORDER BY created_at ASC`, [req.params.id]);
            
        res.render('staff/ticket-view', { user: req.user, ticket: ticket[0], messages });
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to load ticket' });
    }
});

router.post('/staff/ticket/:id/reply', isAuthenticated, isStaff, async (req, res) => {
    const { message } = req.body;
    try {
        await executeQuery('INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES (?, ?, ?)', 
            [req.params.id, req.user.id, message]);
        emitTicketUpdate(req.params.id);
        res.redirect('/staff/ticket/' + req.params.id);
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to add reply' });
    }
});

router.post('/staff/ticket/:id/close', isAuthenticated, isStaff, async (req, res) => {
    try {
        await executeQuery('UPDATE tickets SET status = ? WHERE ticket_id = ?', ['closed', req.params.id]);
        emitTicketUpdate(req.params.id);
        res.redirect('/staff/ticket/' + req.params.id);
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to close ticket' });
    }
});

router.get('/moderation', isAuthenticated, async (req, res) => {
    try {
        const staffs = await executeQuery('SELECT * FROM users WHERE isStaff = 1 AND hideInStaff = 0 ORDER BY position ASC, username ASC');
        const resources = await executeQuery('SELECT * FROM resources');
        res.render('moderation', { staffs, resources });
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to load staff list' });
    }
});

export default router;