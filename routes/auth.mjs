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
    const redirectUrl = req.cookies.redirectTo || '/dashboard';
    
    const isValidRedirect = (url) => {
      return (
        url.startsWith('/') && 
        !url.includes('://') && 
        !url.includes('\\') &&
        !url.includes('..') &&
        url.indexOf('/') === 0
      );
    };

    res.clearCookie('redirectTo');

    if (redirectUrl && isValidRedirect(redirectUrl)) {
      res.redirect(redirectUrl);
    } else {
      res.redirect('/dashboard');
    }
  }
);

export default router;