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
import express from 'express';
import isAuthenticated from '../middleware/auth.mjs';
import executeQuery, { pool } from '../tools/mysql.mjs';

const router = express.Router();

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.redirect('/login');
  }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    res.render('index', { user: req.user });
});

router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const userHistory = await executeQuery('SELECT * FROM punishment_history WHERE discord_id = ?', [req.user.discord_id]);
    res.render('history', { user: req.user, userhistory: userHistory });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/moderation', isAuthenticated, async (req, res) => {
  res.render('moderation', { user: req.user });
});

router.get('/support', isAuthenticated, async (req, res) => {
  const userTickets = await executeQuery('SELECT * FROM tickets WHERE user_id = ?', [req.user.id]);
  res.render('support', { user: req.user, userTickets: userTickets });
});



export default router;