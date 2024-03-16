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

const router = express.Router();

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login');
  }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    res.render('index', { isBeta: pjson.isBeta, version: pjson.version });
});

router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const userHistory = await executeQuery('SELECT * FROM punishment_history WHERE discord_id = ?', [req.user.discord_id]);
    res.render('history', { userhistory: userHistory });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/moderation', isAuthenticated, async (req, res) => {
  const resources = await executeQuery('SELECT * FROM resources');
  const staffs = await executeQuery('SELECT * FROM users WHERE isStaff = 1');
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
              console.error(err);
              res.status(500).render('error', { error: "An error occurred while downloading the resource." });
          } else {
              // res.redirect('/moderation');
          }
      });
  } catch (error) {
      console.error(error);
      res.status(500).render('error', { error: "An error occurred while downloading the resource." });
  }
});

router.get('/support', isAuthenticated, async (req, res) => {
  return res.json({code: '403', error: 'Se denegó el acceso al recurso al cual intenta acceder.'})
  const userTickets = await executeQuery('SELECT * FROM tickets WHERE user_id = ?', [req.user.id]);
  res.render('support', { user: req.user, userTickets: userTickets });
});



export default router;