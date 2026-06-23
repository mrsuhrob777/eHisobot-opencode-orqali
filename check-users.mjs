import Database from 'better-sqlite3';
const db = new Database('/app/data/ehisobot.db');
const rows = db.prepare('SELECT login, role, password FROM User').all();
for (const r of rows) {
  console.log(r.login, r.role, r.password.slice(0, 30));
}
db.close();
