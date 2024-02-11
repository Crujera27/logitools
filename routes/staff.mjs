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
import isStaff from '../middleware/staff.mjs';

const router = express.Router();

router.get('/staff', (req, res) => {
  if (req.isAuthenticated() && isStaff()) {
    res.render('staff/index', { user: req.user });
  } else {
    res.redirect('/login');
  }
});


export default router;