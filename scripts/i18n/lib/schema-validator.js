const path = require('path');
const fs = require('fs');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });

function loadSchema(name) {
  const schemaPath = path.join(__dirname, '..', '..', 'specs', '002-i18n-localization-review', 'contracts', name);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found: ${schemaPath}`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function validate(schemaName, data) {
  const schema = loadSchema(schemaName);
  const validateFn = ajv.compile(schema);
  const ok = validateFn(data);
  return { ok, errors: validateFn.errors };
}

module.exports = { validate };
