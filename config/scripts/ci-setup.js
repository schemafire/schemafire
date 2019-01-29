const { writeFileSync } = require('fs');
const { configDir } = require('../utils');

const secret = Buffer.from(process.env.FIREBASE_JSON_SECRET, 'base64').toString('ascii');
const config = Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('ascii');

writeFileSync(configDir('test', 'db.json'), config);
writeFileSync(configDir('test', 'key.json'), secret);
