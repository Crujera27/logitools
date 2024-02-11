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
import log from './tools/log.mjs'
log('El asistente de inicio de Logitools está inicializando los paquetes de configuración; esto puede tardar un momento.', 'info');
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import flash from 'express-flash';
import { Strategy as DiscordStrategy } from 'passport-discord';
import ejs from 'ejs';
import executeQuery, { pool } from './tools/mysql.mjs';
import { applyPunishment, updateExpirationStatus } from './tools/punishment.mjs';
import path from 'path';
import fs from 'fs'
import toml from 'toml';
log('> Cargando desde index.mjs', 'info');
try {
  const watermark = fs.readFileSync('config/watermark.txt', 'utf8');
  console.log(watermark);
} catch (err) {
  log(`❌> Error al intentar cargar un archivo: ${err.message}`, 'error');
  process.exit();
}


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

const routeModules = [authRoutes, homeRoutes, staffRoutes];

routeModules.forEach((route) => {
  app.use('/', route);
});


const startServer = () => {
  try {
    const { app: appConfig = {} } = toml.parse(fs.readFileSync('./config/configuration.toml', 'utf-8')),
      PORT = appConfig.port || 3000,
      BIND_ADDRESS = appConfig.bind_address || '0.0.0.0';
    app.listen(PORT, BIND_ADDRESS, () => {
      log(`Servidor escuchando en http://${BIND_ADDRESS}:${PORT}`, 'done');
    });
  } catch (error) {
    console.error('Error al intentar leer el archivo de configuraicón: ', error.message);
    process.exit(1);
  }
};
startServer()

const interval = 60 * 60 * 1000;

const runLoop = async () => {
    while (true) {
        await updateExpirationStatus();
        await new Promise(resolve => setTimeout(resolve, interval));
    }
};
runLoop();

const startDiscord = () => {
  import('./discord/bot.js')
}

startDiscord()