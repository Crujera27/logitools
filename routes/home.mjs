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

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login');
  }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    const [videoSetting] = await executeQuery('SELECT setting_value FROM feature_settings WHERE setting_name = ?', ['enable_featured_videos']);
    res.render('index', { 
        isBeta: pjson.isBeta,
        version: pjson.version,
        enableVideos: videoSetting?.setting_value === 'true'
    });
});

router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const userHistory = await executeQuery('SELECT * FROM punishment_history WHERE discord_id = ?', [req.user.discord_id]);
    res.render('history', { userhistory: userHistory });
  } catch (error) {
    log(`Error fetching user history: ${error}`, 'err');
    return res.status(500).render('error', { error : 'Ha ocurrido un error al intentar descargar el recurso.'});
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
        return res.status(404).render('error', { error : 'HTTP 404 - Recirso no encontrado'});
      }

      const originalFilename = resource[0].originalname;
      const filePath = `uploads/${originalFilename}`;

      res.download(filePath, resource[0].link, (err) => {
          if (err) {
              log(err, 'err');
              return res.status(500).render('error', { error : 'HTTP 500 - Ha ocurrido un error al intentar descargar el recurso.'});
          } else {
              // res.redirect('/moderation');
          }
      });
  } catch (error) {
      log(error, 'err');
      return res.status(500).render('error', { error : 'HTTP 500 - Ha ocurrido un error al intentar descargar el recurso.'});
  }
});

router.get('/settings', isAuthenticated, async (req, res) => {
  try {
    const userSettings = await executeQuery(
      'SELECT language FROM users WHERE discord_id = ?', 
      [req.user.discord_id]
    );
    
    const settings = userSettings[0] || {
      language: 'en-EN'
    };

    res.render('settings', { 
      settings,
      query: req.query,
      user: req.user
    });
  } catch (error) {
    log(`Error fetching settings: ${error}`, 'err');
    return res.status(500).render('error', { error: 'Error loading settings page' });
  }
});

router.post('/settings/update', isAuthenticated, async (req, res) => {
  try {
    const settings = {
      language: req.body.language || 'en-EN'
    };

    // Validate language
    if (!['en-EN', 'es-ES'].includes(settings.language)) {
      throw new Error('Invalid language selection');
    }

    await executeQuery(
      `UPDATE users SET 
       language = ?
       WHERE discord_id = ?`,
      [
        settings.language,
        req.user.discord_id
      ]
    );

    res.redirect('/settings?success=true');
  } catch (error) {
    log(`Error updating settings: ${error}`, 'err');
    res.redirect('/settings?error=true');
  }
});

router.get('/api/videos/random', isAuthenticated, async (req, res) => {
  try {
    const [videoSetting] = await executeQuery('SELECT setting_value FROM feature_settings WHERE setting_name = ?', ['enable_featured_videos']);
    if (videoSetting?.setting_value !== 'true') {
      return res.json({ url: '', enabled: false });
    }

    const video = await executeQuery('SELECT url FROM featured_videos ORDER BY RAND() LIMIT 1');
    if (video.length === 0) {
      return res.json({ url: '', enabled: true });
    }
    res.json({ url: video[0].url, enabled: true });
  } catch (error) {
    log(`Error fetching random video: ${error}`, 'err');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;