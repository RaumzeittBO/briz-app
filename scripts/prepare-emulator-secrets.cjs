const { existsSync, writeFileSync } = require('node:fs');
const path = 'functions/.secret.local';
if (!existsSync(path)) {
  writeFileSync(path, 'TELEGRAM_BOT_TOKEN=emulator-disabled\nTELEGRAM_CHAT_ID=emulator-disabled\nRESEND_API_KEY=re_emulator_only_not_valid\n', { flag: 'wx' });
}
