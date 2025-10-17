const util = require('util');

function formatMeta(meta) {
  try {
    return typeof meta === 'string' ? meta : util.inspect(meta, { depth: 3, colors: false });
  } catch (e) {
    return String(meta);
  }
}

const log = {
  info: (msg, meta) => {
    console.log(`[i18n][INFO] ${msg}` + (meta ? ` ${formatMeta(meta)}` : ''));
  },
  warn: (msg, meta) => {
    console.warn(`[i18n][WARN] ${msg}` + (meta ? ` ${formatMeta(meta)}` : ''));
  },
  error: (msg, meta) => {
    console.error(`[i18n][ERROR] ${msg}` + (meta ? ` ${formatMeta(meta)}` : ''));
  }
};

module.exports = { log };
