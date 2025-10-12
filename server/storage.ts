import { SqliteStorage, type IStorage } from './sqliteStorage';

export const storage: IStorage = new SqliteStorage();
