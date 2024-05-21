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
import log from './tools/log.mjs'
log('El asistente de inicio de Logitools está inicializando los paquetes de configuración; esto puede tardar un momento.', 'info');
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import flash from 'express-flash';
import { Strategy as DiscordStrategy } from 'passport-discord';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs'
import toml from 'toml';
import { postbootchecks } from './tools/bootchecks.mjs'
import executeQuery, { pool } from './tools/mysql.mjs';
import { applyPunishment, updateExpirationStatus } from './tools/punishment.mjs';
log('> Booting from index.mjs', 'info');
try {
  console.log(fs.readFileSync('config/asccii/watermark.txt', 'utf8'));
} catch (err) {
  log(`❌> Error al intentar cargar un archivo: ${err.message}`, 'error');
  process.exit();
}
log('> Cargando desde index.mjs', 'info');
await postbootchecks()


const app = express();


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.set('view engine', 'ejs');
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
const BASE_PATH = path.resolve();
app.use('/public', express.static(path.join(BASE_PATH, 'public')));


passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ['identify'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [rows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [profile.id]);

        if (rows.length === 0) {
          await pool.query('INSERT INTO users (discord_id, username, discriminator, avatar_uuid, banned) VALUES (?, ?, ?, ?, false)',
            [profile.id, profile.username, profile.discriminator, profile.avatar]);
          const [newUserRows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [profile.id]);
          return done(null, newUserRows[0]);
        } else {
          const dbUser = rows[0];

          if (
            dbUser.username !== profile.username ||
            dbUser.discriminator !== profile.discriminator ||
            dbUser.avatar !== profile.avatar
          ) {
            await pool.query('UPDATE users SET username=?, discriminator=?, avatar_uuid=? WHERE discord_id=?',
              [profile.username, profile.discriminator, profile.avatar, profile.id]);
          }
          /*
          Pospuesto para otra versión, de momento lo gestiona el middelware de auth.mjs
          if (dbUser.banned) {
            return done(null, false, { message: 'User is banned.' });
          }
          */
          return done(null, dbUser);

        }
      } catch (error) {
        return done(error);
      }
    }
  )
);


passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  const params = [user.id];

  executeQuery(query, params)
    .then((results) => {
      if (results.length > 0) {
        return done(null, results[0]);
      } else {
        return done(new Error('500 | Fatal Server Error (UNF-1)'));
      }
    })
    .catch((error) => {
      console.error('Error querying database:', error);
      return done(error);
    });
});





// Route handlers


import authRoutes from './routes/auth.mjs';
import homeRoutes from './routes/home.mjs';
import staffRoutes from './routes/staff.mjs';
import adminRoutes from './routes/admin.mjs';
import supportRoutes from './routes/support.mjs'

const routeModules = [authRoutes, homeRoutes, staffRoutes, adminRoutes, supportRoutes];

routeModules.forEach((route) => {
  app.use('/', route);
});


const startWebServer = async () => {
  try {
    const parseConfigModule = (
      await import("./tools/parseConfig.mjs")
    ).default;
    const parseConfig = await parseConfigModule;
    const appConfig = await parseConfig();
    const PORT = appConfig.port || 3000;
    const BIND_ADDRESS = appConfig.bind_address || '0.0.0.0';
    app.listen(PORT, BIND_ADDRESS, () => {
      log(`Servidor escuchando en http://${BIND_ADDRESS}:${PORT}`, 'info');
    });
    if(appConfig.pterodactyl.enabled == true){
      console.log(appConfig.pterodactyl.log_msg)
    }
  } catch (error) {
    log(`Error occurred while trying to read the configuration file: ${error.message}`, 'err');
    process.exit(1);
  }
};

startWebServer();


const interval = 60 * 60 * 1000;

const punishmentloop = async () => {
    while (true) {
        await updateExpirationStatus();
        await new Promise(resolve => setTimeout(resolve, interval));
    }
};
punishmentloop();

const startDiscord = () => {
  import('./discord/bot.js')
}

startDiscord()