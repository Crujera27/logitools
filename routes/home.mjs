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
import log from '../tools/log.mjs';

const router = express.Router();

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login');
  }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    res.render('index', { isBeta: pjson.isBeta, version: pjson.version, relasenotes: pjson.relasenotes });
});

router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const userHistory = await executeQuery('SELECT * FROM punishment_history WHERE discord_id = ?', [req.user.discord_id]);
    res.render('history', { userhistory: userHistory });
  } catch (error) {
    log(`Error fetching user history: ${error}`, 'err');
    res.status(500).send('Internal Server Error');
  }
});

router.get('/moderation', isAuthenticated, async (req, res) => {
  const resources = await executeQuery('SELECT * FROM resources');
  const staffs = await executeQuery('SELECT * FROM users WHERE isStaff = 1 AND hideInStaff = 0');
  res.render('moderation', { resources: resources, staffs: staffs });
});

router.get('/moderation/download/:id', isAuthenticated, async (req, res) => {
  const resourceId = req.params.id;
  try {
      const resource = await executeQuery('SELECT * FROM resources WHERE id = ?', [resourceId]);
      if (resource.length === 0) {
          return res.status(404).render('error', { error: "Resource not found." });
      }

      const originalFilename = resource[0].originalname;
      const filePath = `uploads/${originalFilename}`;

      res.download(filePath, resource[0].link, (err) => {
          if (err) {
              log(err, 'err');
              res.status(500).render('error', { error: "An error occurred while downloading the resource." });
          } else {
              // res.redirect('/moderation');
          }
      });
  } catch (error) {
      log(error, 'err');
      res.status(500).render('error', { error: "An error occurred while downloading the resource." });
  }
});

router.get('/support', isAuthenticated, async (req, res) => {
  return res.json({code: '403', error: 'Se denegó el acceso al recurso al cual intenta acceder.'})
  const userTickets = await executeQuery('SELECT * FROM tickets WHERE user_id = ?', [req.user.id]);
  res.render('support', { user: req.user, userTickets: userTickets });
});



export default router;