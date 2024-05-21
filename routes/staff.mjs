/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024  Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

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




export default router;