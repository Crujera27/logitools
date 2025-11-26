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

import { readFileSync } from 'fs';
import * as toml from 'toml';

const loadTranslations = (locale) => {
    try {
        const content = readFileSync(`./config/locales/${locale}.toml`, 'utf-8');
        return toml.parse(content);
    } catch (error) {
        console.error(`Failed to load locale ${locale}:`, error);
        // Fallback to default locale
        const defaultContent = readFileSync('./config/locales/en-EN.toml', 'utf-8');
        return toml.parse(defaultContent);
    }
};

export const localeMiddleware = async (req, res, next) => {
    const userLang = req.user?.language || 'es-ES';
    res.locals.t = loadTranslations(userLang);
    res.locals.currentLocale = userLang;
    next();
};