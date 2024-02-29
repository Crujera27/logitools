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
import { pjson } from '../tools/pjson.mjs';
import isAdmin from '../middleware/admin.mjs';
import toml from 'toml';
import fs from 'fs';
import os from 'os'

const router = express.Router();

router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    return res.render('admin/index', { user: req.user, version: pjson.version, versionnotes: pjson.relasenotes, appname: pjson.name, osrelase: os.release(), oshostname: os.hostname(), ostype: os.type()});
})

router.get('/admin/verify', isAuthenticated, isAdmin, async (req, res) => {
    return res.render('admin/verify', { user: req.user});
})



export default router;