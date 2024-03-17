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
import passport from 'passport';
import { pjson } from '../tools/pjson.mjs';
import isAuthenticated from '../middleware/auth.mjs';
import parseConfig from '../tools/parseConfig.mjs';
import log from '../tools/log.mjs';

const router = express.Router();

router.get('/login', async (req, res) => {
  try {
    const appConfig = await parseConfig();

    res.render('login', {
      devVersion: true,
      version: pjson.version,
      app: appConfig,
    });
  } catch (error) {
    log(`Error reading/parsing configuration file: ${error}`, 'err');
    res.status(500).send('Internal Server Error');
  }
});



router.get('/logout', isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      log(`Error en logout: ${err}`, 'err');
      return res.status(500).send('500 | Internal Server Error');
    }
    res.redirect('/');
  });
});

router.get('/auth/discord', passport.authenticate('discord'));

router.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    const redirectTo = req.session.returnTo || '/';

    res.redirect(redirectTo);
  });

export default router;