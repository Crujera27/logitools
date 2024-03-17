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