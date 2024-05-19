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
import parseConfig from '../tools/parseConfig.mjs';
import log from '../tools/log.mjs';

const isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
    try {
      const appConfig = await parseConfig();
      res.locals.app = appConfig;
    } catch (error) {
      log(`Error loading app config: ${error}`, 'err');
      res.status(500).send('Internal Server Error');
      return;
    }
    
    if (!req.user.banned) {
      return next();
    } else {
      if (req.route.path !== '/logout') {
        return res.render('not-approved');
      } else {
        return next();
      }
    }
  } else {
    try {
      const appConfig = await parseConfig();
      res.locals.app = appConfig;
    } catch (error) {
      log(`Error loading app config: ${error}`, 'err');
      res.status(500).send('Internal Server Error');
      return;
    }
    
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
};


export default isAuthenticated;