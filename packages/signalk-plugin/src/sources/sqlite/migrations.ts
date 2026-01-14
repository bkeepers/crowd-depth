import { Database } from "better-sqlite3";

export type Migration = (db: Database) => void;

export function runMigrations(db: Database, migrations: Migration[]) {
  const version = db.pragma("user_version", { simple: true }) as number;
  migrations.slice(version).forEach((migration, i) => {
    db.transaction(() => {
      migration(db);
      db.pragma(`user_version = ${version + i + 1}`);
    })();
  });
}
