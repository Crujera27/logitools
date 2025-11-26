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
import log from '../tools/log.mjs';
const router = express.Router();


router.get('/support', isAuthenticated, async (req, res) => {
    try {
        const tickets = await executeQuery(`
            SELECT t.*, 
                   COUNT(m.message_id) as message_count 
            FROM tickets t 
            LEFT JOIN ticket_messages m ON t.ticket_id = m.ticket_id 
            WHERE t.user_id = ? 
            GROUP BY t.ticket_id 
            ORDER BY t.created_at DESC`, 
            [req.user.id]);
        res.render('tickets/index', { user: req.user, tickets });
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to load tickets' });
    }
});

router.get('/support/new', isAuthenticated, async (req, res) => {
    res.render('tickets/new', { user: req.user });
});

router.post('/support/new', isAuthenticated, async (req, res) => {
    const { subject, message } = req.body;
    
    // Generate random ticket ID (8 characters)
    const ticketId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    try {
        await executeQuery('INSERT INTO tickets (ticket_id, user_id, subject) VALUES (?, ?, ?)', 
            [ticketId, req.user.id, subject]);
        
        await executeQuery('INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES (?, ?, ?)', 
            [ticketId, req.user.id, message]);
            
        res.redirect('/support/view/' + ticketId);
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to create ticket' });
    }
});

router.get('/support/view/:id', isAuthenticated, async (req, res) => {
    try {
        const ticket = await executeQuery('SELECT * FROM tickets WHERE ticket_id = ? AND user_id = ?', 
            [req.params.id, req.user.id]);
            
        if (!ticket.length) {
            return res.status(404).render('error', { error: 'Ticket not found' });
        }
        
        const messages = await executeQuery(`
            SELECT m.*, u.username, u.isStaff 
            FROM ticket_messages m 
            LEFT JOIN users u ON m.user_id = u.id 
            WHERE ticket_id = ? 
            ORDER BY created_at ASC`, [req.params.id]);
            
        res.render('tickets/view', { user: req.user, ticket: ticket[0], messages });
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to load ticket' });
    }
});

router.post('/support/reply/:id', isAuthenticated, async (req, res) => {
    const { message } = req.body;
    try {
        // Verify ticket ownership
        const ticket = await executeQuery('SELECT * FROM tickets WHERE ticket_id = ? AND user_id = ?', 
            [req.params.id, req.user.id]);
            
        if (!ticket.length || ticket[0].status !== 'open') {
            return res.status(403).render('error', { error: 'Cannot reply to this ticket' });
        }
        
        await executeQuery('INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES (?, ?, ?)', 
            [req.params.id, req.user.id, message]);
            
        res.redirect('/support/view/' + req.params.id);
    } catch (error) {
        log(error, 'err');
        res.status(500).render('error', { error: 'Failed to add reply' });
    }
});

export default router;