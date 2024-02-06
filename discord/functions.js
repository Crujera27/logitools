/**
 * Logs a message with optional styling.
 *
 * @param {string} string - The message to log.
 * @param {'info' | 'err' | 'warn' | 'done' | undefined} style - The style of the log.
 */
let logPromise = (async () => {
  const remotelogpromise = import('../tools/log.mjs');
  const remotelog = await remotelogpromise;
  return (string, style) => {
    remotelog.default(string, style);
  };
})();

(async () => {
  const log = await logPromise;
  
})();

/**
 * Formats a timestamp.
 *
 * @param {number} time - The timestamp in milliseconds.
 * @param {import('discord.js').TimestampStylesString} style - The timestamp style.
 * @returns {string} - The formatted timestamp.
 */
const time = (time, style) => {
  return `<t:${Math.floor(time / 1000)}${style ? `:${style}` : ""}>`;
};

/**
 * Whenever a string is a valid snowflake (for Discord).
 *
 * @param {string} id 
 * @returns {boolean}
 */
const isSnowflake = (id) => {
  return /^\d+$/.test(id);
};



module.exports = {
  log: async (string, style) => {
    const log = await logPromise;
    log(string, style);
  },
  time,
  isSnowflake
};
