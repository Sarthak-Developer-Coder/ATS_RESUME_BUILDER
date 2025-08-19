// encode-firebase-key.js
// Usage: node encode-firebase-key.js /path/to/service-account.json
// It will print a single-line string for FIREBASE_PRIVATE_KEY with \n newlines escaped.

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node encode-firebase-key.js /path/to/service-account.json-or-pem');
  process.exit(1);
}

const filePath = path.resolve(args[0]);
try {
  const content = fs.readFileSync(filePath, 'utf8');
  // If JSON, try to extract private_key field
  try {
    const parsed = JSON.parse(content);
    if (parsed.private_key) {
      const escaped = parsed.private_key.replace(/\n/g, '\\n');
      console.log('FIREBASE_PRIVATE_KEY="' + escaped + '"');
      process.exit(0);
    }
  } catch (e) {
    // not JSON, continue
  }

  // Otherwise treat as PEM/plain text
  const escaped = content.replace(/\r?\n/g, '\\n');
  console.log('FIREBASE_PRIVATE_KEY="' + escaped + '"');
} catch (err) {
  console.error('Error reading file:', err.message);
  process.exit(2);
}
