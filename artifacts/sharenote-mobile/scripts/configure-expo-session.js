const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sessionSecret = process.env.REPLIT_EXPO_SESSION_SECRET;

if (!sessionSecret) {
  process.exit(0);
}

const expoHome = path.join(os.homedir(), '.expo');
const statePath = path.join(expoHome, 'state.json');

fs.mkdirSync(expoHome, { recursive: true, mode: 0o700 });

let state = {};

try {
  state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) {
    throw error;
  }
}

state.auth = { sessionSecret };

fs.writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
fs.chmodSync(statePath, 0o600);