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