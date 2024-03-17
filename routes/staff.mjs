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
    Licencia del proyecto: CC BY-NC-ND 4.0

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
        return res.status(500).json({ error: '500 | Server Error' });
    }
});

router.get('/staff/punishmentmanager/revokepunishment', isAuthenticated, isStaff, async (req, res) => {
  const { punishmentId, userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'La URL ha sido manipulada. Las acciones han sido registradas' });
  }
  if (!punishmentId || isNaN(punishmentId)) {
    return res.status(400).json({ error: 'ID de la sanción inválida' });
  }
  try {
    await sendLog('Registro eliminado', req.user.discord_id, userId, `ID: ${punishmentId}`);
    await executeQuery('DELETE FROM punishment_history WHERE id = ?', [punishmentId]);
    res.redirect(`/staff/punishmentmanager?done=true&userId=${userId}`);
  } catch (error) {
    log(error, 'err');
    return res.status(500).json({ error: '500 | Server Error' });
  }
});




export default router;