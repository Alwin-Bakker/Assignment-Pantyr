import { LowSync, JSONFileSync } from 'lowdb-node';
import path from 'path';
import fs from 'fs';
import type { Session } from './domain/sessionTypes';

export type DbData = {
  sessions: Record<string, Session>;
};

// Store at <repo-root>/tmp/db.json so it persists across backend restarts
// but is easy to wipe (delete the file) and is .gitignored.
const dbPath = path.resolve(__dirname, '..', '..', 'tmp', 'db.json');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const adapter = new JSONFileSync<DbData>(dbPath);
const db = new LowSync<DbData>(adapter);

export function readDb(): DbData {
  db.read();
  db.data ??= { sessions: {} };
  return db.data;
}

export function writeDb(): void {
  db.write();
}
