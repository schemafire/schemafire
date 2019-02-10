const { writeFileSync } = require('fs');
const { supportDir } = require('../utils');

const config = Buffer.from(process.env.FIREBASE_JSON_DB, 'base64').toString('ascii');
const secret = Buffer.from(process.env.FIREBASE_JSON_SECRET, 'base64').toString('ascii');

writeFileSync(supportDir('secrets', 'db.json'), config);
writeFileSync(supportDir('secrets', 'key.json'), secret);
