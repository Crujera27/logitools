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
import executeQuery from '../tools/mysql.mjs';
import { pjson } from '../tools/pjson.mjs';
import isAdmin from '../middleware/admin.mjs';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { dirname } from 'path';
import sendLog from '../tools/discordlog.mjs'
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    return res.render('admin/index', { user: req.user, version: pjson.version, versionnotes: pjson.relasenotes, appname: pjson.name, osrelase: os.release(), oshostname: os.hostname(), ostype: os.type()});
})

router.get('/admin/verify', isAuthenticated, isAdmin, async (req, res) => {
    if(req.user.adminVerifyStatus=="verified"){
        return res.redirect('/admin');
    }
    sendDM(req.user.discord_id, 'Tu código es: XXXX')
    return res.render('admin/verify');
})

router.get('/admin/resources', isAuthenticated, isAdmin, async (req, res) => {
    const resources = await executeQuery('SELECT * FROM resources');
    return res.render('admin/resources', {resources: resources});
})

/* Staff Manager */

router.get('/admin/staffmanager', isAuthenticated, isAdmin, async (req, res) => {
    const staffs = await executeQuery('SELECT * FROM users WHERE isStaff = 1');
    return res.render('admin/staffmanager', {staffs: staffs});
})


router.get('/admin/staffmanager/id/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const staff = await executeQuery('SELECT * FROM users WHERE isStaff = 1 AND discord_id = ?', [req.params.id]);
        return res.render('admin/view-staff', { staff: staff[0] });
    } catch (error) {
        console.error('Error fetching staff members:', error);
        return res.status(500).send('Internal Server Error');
    }
});

router.post('/admin/staffmanager/setrank/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { staffRank } = req.body;
        const updateQuery = 'UPDATE users SET staffrank = ? WHERE isStaff = 1 AND discord_id = ?';
        await sendLog('Rango establecido', req.user.discord_id, id, `Acción realizada a través del panel de administración (SM)`);
        await executeQuery(updateQuery, [staffRank, id]);
        return res.redirect('/admin/staffmanager/id/' + id);
    } catch (error) {
        console.error('Error updating staff rank:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/staffmanager/suspend/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET banned = 1 WHERE discord_id = ?';
        await sendLog('Cuenta suspendida (dashboard)', req.user.discord_id, id, `Acción realizada a través del panel de administración (SM)`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/staffmanager/id/' + id);
    } catch (error) {
        console.error('Error suspending user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/staffmanager/unsuspend/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET banned = 0 WHERE discord_id = ?';
        await sendLog('Cuenta dessuspendida (dashboard)', req.user.discord_id, id, `Acción realizada a través del panel de administración (SM)`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/staffmanager/id/' + id);
    } catch (error) {
        console.error('Error unsuspending user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/staffmanager/addadmin/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET isAdmin = 1 WHERE discord_id = ?';
        await sendLog('Administrador añadido', req.user.discord_id, id, `Acción realizada a través del panel de administración`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/staffmanager/id/' + id);
    } catch (error) {
        console.error('Error adding admin user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/staffmanager/removeadmin/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET isAdmin = 0 WHERE discord_id = ?';
        await sendLog('Administrador eliminado', req.user.discord_id, id, `Acción realizada a través del panel de administración`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/staffmanager/id/' + id);
    } catch (error) {
        console.error('Error removing admin user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/staffmanager/removestaff/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET isStaff = 0, isAdmin = 0 WHERE discord_id = ?';
        await sendLog('Staff eliminado', req.user.discord_id, id, `Acción realizada a través del panel de administración`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/staffmanager');
    } catch (error) {
        console.error('Error removing staff member:', error);
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/admin/staffmanager/addstaff', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { discord_id } = req.body;
        if (!discord_id) {
            return res.redirect('/admin/staffmanager');
        }
        if (isNaN(discord_id)) {
            return res.redirect('/admin/staffmanager');
        }
        const staffQuery = 'SELECT isStaff FROM users WHERE discord_id = ?';
        const [existingStaff] = await executeQuery(staffQuery, [discord_id]);

        if (existingStaff && existingStaff.isStaff === 1) {
            return res.redirect('/admin/staffmanager');
        }
        const updateQuery = 'UPDATE users SET isStaff = 1 WHERE discord_id = ?';
        await sendLog('Staff añadido', req.user.discord_id, id, `Acción realizada a través del panel de administración`);
        await executeQuery(updateQuery, [discord_id]);
        return res.redirect('/admin/staffmanager');
    } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).send('Internal Server Error');
    }
});






/* End Staff Manager */

/* User Manager */

router.get('/admin/usermanager', isAuthenticated, isAdmin, async (req, res) => {
    const users = await executeQuery('SELECT * FROM users');
    return res.render('admin/usermanager', {users: users});
})

router.post('/admin/usermanager/suspend/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET banned = 1 WHERE discord_id = ?';
        await sendLog('Cuenta suspendida (dashboard)', req.user.discord_id, id, `Acción realizada a través del panel de administración (UM)`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/usermanager');
    } catch (error) {
        console.error('Error suspending user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/admin/usermanager/unsuspend/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateQuery = 'UPDATE users SET banned = 0 WHERE discord_id = ?';
        await sendLog('Cuenta dessuspendida (dashboard)', req.user.discord_id, id, `Acción realizada a través del panel de administración (UM)`);
        await executeQuery(updateQuery, [id]);
        return res.redirect('/admin/usermanager');
    } catch (error) {
        console.error('Error unsuspending user:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

/* End User Manager */

router.post('/admin/addresource', isAuthenticated, isAdmin, upload.single('resourceFile'), async (req, res) => {
    const { resourceName } = req.body;
    const uploadedFile = req.file;

    try {
        if (!uploadedFile) {
            return res.status(400).render('error', { error: "Please provide a file." });
        }
        const fileId = uuidv4();
        const filePath = `uploads/${fileId}`;
        fs.renameSync(uploadedFile.path, filePath);
        await executeQuery('INSERT INTO resources (name, link, originalname, createdby) VALUES (?, ?, ?, ?)', [resourceName, uploadedFile.originalname, fileId, req.user.discord_id]);

        res.redirect('/admin/resources');
    } catch (error) {
        res.status(500).render('error', { error: "An error occurred while adding the resource." });
    }
});

router.post('/admin/deleteresource/:id', isAuthenticated, isAdmin, async (req, res) => {
    const resourceId = req.params.id;
    try {
        const resource = await executeQuery('SELECT * FROM resources WHERE id = ?', [resourceId]);
        if (resource.length === 0) {
            return res.status(404).render('error', { error: "Resource not found." });
        }
        await executeQuery('DELETE FROM resources WHERE id = ?', [resourceId]);
        const fileName = resource[0].originalname;
        const filePath = path.join(__dirname, `../uploads/${fileName}`);
        fs.unlinkSync(filePath);

        res.redirect('/admin/resources');
    } catch (error) {
        res.status(500).render('error', { error: "An error occurred while deleting the resource." });
    }
});

router.get('/admin/download/:id', isAuthenticated, isAdmin, async (req, res) => {
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
                // res.redirect('/admin/resources');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error: "An error occurred while downloading the resource." });
    }
});

export default router;
