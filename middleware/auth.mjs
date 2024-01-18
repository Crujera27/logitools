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
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      res.locals.user = req.user;
      if (!req.user.banned) {
        return next();
      } else {
        if(req.route.path !== '/logout'){
        res.render('not-approved');
        }else{
          return next();
        }
      }
    } else {
      res.redirect('/');
    }
  };
  
  export default isAuthenticated;