import Database from "better-sqlite3";

export function createDB(filename: string): Database.Database {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");

  runMigrations(db, [
    () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS bathymetry(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          longitude REAL NOT NULL,
          latitude REAL NOT NULL,
          depth REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          heading REAL
        );

        CREATE INDEX IF NOT EXISTS idx_bathymetry_timestamp ON bathymetry(timestamp);
        CREATE INDEX IF NOT EXISTS idx_bathymetry_location ON bathymetry(latitude, longitude);
      `);
    },
    () => {
      db.exec(`
        CREATE TABLE reports (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "fromTimestamp" INTEGER NOT NULL,
          "toTimestamp" INTEGER NOT NULL
        );
      `);
    },
  ]);

  return db;
}

export type Migration = (db: Database.Database) => void;

export function runMigrations(db: Database.Database, migrations: Migration[]) {
  const version = db.pragma("user_version", { simple: true }) as number;
  migrations.slice(version).forEach((migration, i) => {
    db.transaction(() => {
      migration(db);
      db.pragma(`user_version = ${version + i + 1}`);
    })();
  });
}
