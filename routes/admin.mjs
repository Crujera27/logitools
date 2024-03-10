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
import sendDM from '../discord/events/Client/DM.js';
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
