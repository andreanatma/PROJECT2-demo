/**
 * Database tiruan (in-memory) pengganti Prisma + MySQL, untuk mode demo/testing tanpa database.
 *
 * - API sengaja dibuat mirip Prisma (findMany, findUnique, create, update, upsert, $transaction, ...)
 *   sehingga seluruh halaman dan server action tidak perlu diubah.
 * - Data awal diisi dari ./mock-seed. Perubahan (CRUD, pesan kontak, sesi admin, upload) hidup di memori
 *   proses Node dan HILANG saat server restart / cold start.
 */
import { randomUUID } from "crypto";
import { buildSeed } from "./mock-seed";

/* ------------------------------------------------------------------ */
/* Tipe model (mengikuti prisma/schema.prisma versi sebelumnya)        */
/* ------------------------------------------------------------------ */
export type Role = "SUPER_ADMIN" | "ADMIN";
export type PublishStatus = "DRAFT" | "PUBLISHED";
export type MessageStatus = "UNREAD" | "READ" | "REPLIED";

export type User = { id: number; name: string; email: string; passwordHash: string; role: Role; isActive: boolean; lastLoginAt: Date | null; createdAt: Date; updatedAt: Date };
export type Session = { id: string; tokenHash: string; userId: number; user: User; ipAddress: string | null; userAgent: string | null; createdAt: Date; lastActivityAt: Date; expiresAt: Date };
export type MediaFile = { id: number; storageKey: string; originalName: string; mimeType: string; sizeBytes: number; isPublic: boolean; uploadedById: number | null; createdAt: Date };
export type Service = { id: number; name: string; slug: string; description: string; imageId: number | null; metaTitle: string | null; metaDescription: string | null; createdAt: Date; updatedAt: Date };
export type Product = { id: number; name: string; slug: string; description: string; specifications: string | null; imageId: number | null; pdfId: number | null; metaTitle: string | null; metaDescription: string | null; createdAt: Date; updatedAt: Date };
export type Portfolio = { id: number; name: string; slug: string; description: string; imageId: number | null; projectDate: Date | null; createdAt: Date; updatedAt: Date };
export type Gallery = { id: number; title: string; description: string | null; imageId: number | null; createdAt: Date; updatedAt: Date };
export type TeamMember = { id: number; name: string; position: string; photoId: number | null; displayOrder: number; createdAt: Date; updatedAt: Date };
export type Blog = { id: number; title: string; slug: string; content: string; excerpt: string | null; featuredImageId: number | null; publishedAt: Date | null; status: PublishStatus; metaTitle: string | null; metaDescription: string | null; createdAt: Date; updatedAt: Date };
export type ContactMessage = { id: number; name: string; email: string; message: string; status: MessageStatus; ipHash: string | null; createdAt: Date };
export type ActivityLog = { id: number; userId: number | null; user: User | null; action: string; entity: string; entityId: string | null; summary: string; ipAddress: string | null; createdAt: Date };
export type SiteSetting = { key: string; value: string; updatedAt: Date };
export type SeoSetting = { id: number; pageKey: string; title: string | null; description: string | null; ogImageId: number | null; ogImage: MediaFile | null; noindex: boolean; updatedAt: Date };

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Delegate<T> = {
  findMany(args?: any): Promise<T[]>;
  findUnique(args: any): Promise<T | null>;
  findFirst(args?: any): Promise<T | null>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<T>;
  createMany(args: any): Promise<{ count: number }>;
  update(args: any): Promise<T>;
  upsert(args: any): Promise<T>;
  delete(args: any): Promise<T>;
  deleteMany(args?: any): Promise<{ count: number }>;
};

export type Db = {
  user: Delegate<User>;
  session: Delegate<Session>;
  mediaFile: Delegate<MediaFile>;
  service: Delegate<Service>;
  product: Delegate<Product>;
  portfolio: Delegate<Portfolio>;
  gallery: Delegate<Gallery>;
  teamMember: Delegate<TeamMember>;
  blog: Delegate<Blog>;
  contactMessage: Delegate<ContactMessage>;
  activityLog: Delegate<ActivityLog>;
  siteSetting: Delegate<SiteSetting>;
  seoSetting: Delegate<SeoSetting>;
  $transaction<R>(arg: Promise<R>[]): Promise<R[]>;
  $transaction<R>(arg: (tx: Db) => Promise<R>): Promise<R>;
};

/* ------------------------------------------------------------------ */
/* Definisi model                                                      */
/* ------------------------------------------------------------------ */
export type Row = Record<string, any>;
export type ModelName = Exclude<keyof Db, "$transaction">;

type ModelDef = {
  pk: string;
  autoId?: "int" | "uuid";
  unique: string[];
  nullDefaults: string[];
  defaults?: Row;
  createdAt?: boolean;
  updatedAt?: boolean;
  /** relasi to-one untuk `include`/`select` bersarang: nama -> [model tujuan, kolom FK] */
  rel?: Record<string, [ModelName, string]>;
};

const DEFS: Record<ModelName, ModelDef> = {
  user: { pk: "id", autoId: "int", unique: ["email"], nullDefaults: ["lastLoginAt"], defaults: { role: "ADMIN", isActive: true }, createdAt: true, updatedAt: true },
  session: { pk: "id", autoId: "uuid", unique: ["tokenHash"], nullDefaults: ["ipAddress", "userAgent"], rel: { user: ["user", "userId"] }, createdAt: true },
  mediaFile: { pk: "id", autoId: "int", unique: ["storageKey"], nullDefaults: ["uploadedById"], defaults: { isPublic: true }, createdAt: true, rel: { uploadedBy: ["user", "uploadedById"] } },
  service: { pk: "id", autoId: "int", unique: ["slug"], nullDefaults: ["imageId", "metaTitle", "metaDescription"], createdAt: true, updatedAt: true, rel: { image: ["mediaFile", "imageId"] } },
  product: { pk: "id", autoId: "int", unique: ["slug"], nullDefaults: ["specifications", "imageId", "pdfId", "metaTitle", "metaDescription"], createdAt: true, updatedAt: true, rel: { image: ["mediaFile", "imageId"], pdf: ["mediaFile", "pdfId"] } },
  portfolio: { pk: "id", autoId: "int", unique: ["slug"], nullDefaults: ["imageId", "projectDate"], createdAt: true, updatedAt: true, rel: { image: ["mediaFile", "imageId"] } },
  gallery: { pk: "id", autoId: "int", unique: [], nullDefaults: ["description", "imageId"], createdAt: true, updatedAt: true, rel: { image: ["mediaFile", "imageId"] } },
  teamMember: { pk: "id", autoId: "int", unique: [], nullDefaults: ["photoId"], defaults: { displayOrder: 0 }, createdAt: true, updatedAt: true, rel: { photo: ["mediaFile", "photoId"] } },
  blog: { pk: "id", autoId: "int", unique: ["slug"], nullDefaults: ["excerpt", "featuredImageId", "publishedAt", "metaTitle", "metaDescription"], defaults: { status: "DRAFT" }, createdAt: true, updatedAt: true, rel: { featuredImage: ["mediaFile", "featuredImageId"] } },
  contactMessage: { pk: "id", autoId: "int", unique: [], nullDefaults: ["ipHash"], defaults: { status: "UNREAD" }, createdAt: true },
  activityLog: { pk: "id", autoId: "int", unique: [], nullDefaults: ["userId", "entityId", "ipAddress"], createdAt: true, rel: { user: ["user", "userId"] } },
  siteSetting: { pk: "key", unique: [], nullDefaults: [], updatedAt: true },
  seoSetting: { pk: "id", autoId: "int", unique: ["pageKey"], nullDefaults: ["title", "description", "ogImageId"], defaults: { noindex: false }, updatedAt: true, rel: { ogImage: ["mediaFile", "ogImageId"] } },
};

/** Perilaku onDelete: ketika baris `from` dihapus, baris di `model.field` di-cascade atau di-set null. */
const ON_DELETE: Partial<Record<ModelName, { model: ModelName; field: string; action: "cascade" | "setNull" }[]>> = {
  user: [
    { model: "session", field: "userId", action: "cascade" },
    { model: "activityLog", field: "userId", action: "setNull" },
    { model: "mediaFile", field: "uploadedById", action: "setNull" },
  ],
  mediaFile: [
    { model: "service", field: "imageId", action: "setNull" },
    { model: "product", field: "imageId", action: "setNull" },
    { model: "product", field: "pdfId", action: "setNull" },
    { model: "portfolio", field: "imageId", action: "setNull" },
    { model: "gallery", field: "imageId", action: "setNull" },
    { model: "teamMember", field: "photoId", action: "setNull" },
    { model: "blog", field: "featuredImageId", action: "setNull" },
    { model: "seoSetting", field: "ogImageId", action: "setNull" },
  ],
};

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
export type Store = { tables: Record<ModelName, Row[]>; counters: Record<string, number>; files: Map<string, Buffer> };

const g = globalThis as unknown as { __apexMock?: { store: Store; db: Db } };

function newStore(): Store {
  const tables = Object.fromEntries(Object.keys(DEFS).map((k) => [k, [] as Row[]])) as Record<ModelName, Row[]>;
  return { tables, counters: {}, files: new Map() };
}

/* ------------------------------------------------------------------ */
/* Query helpers                                                       */
/* ------------------------------------------------------------------ */
const isDate = (v: unknown): v is Date => v instanceof Date;
const norm = (v: any) => (isDate(v) ? v.getTime() : typeof v === "string" ? v.toLowerCase() : v);

function eq(a: any, b: any): boolean {
  if (a == null || b == null) return a == null && b == null;
  return norm(a) === norm(b);
}

function cmp(a: any, b: any): number {
  const x = norm(a), y = norm(b);
  if (x == null && y == null) return 0;
  if (x == null) return -1; // NULL lebih kecil (perilaku MySQL)
  if (y == null) return 1;
  return x < y ? -1 : x > y ? 1 : 0;
}

function matchField(v: any, cond: any): boolean {
  if (cond === null || typeof cond !== "object" || isDate(cond)) return eq(v, cond);
  for (const [op, arg] of Object.entries(cond)) {
    if (arg === undefined) continue;
    switch (op) {
      case "equals": if (!eq(v, arg)) return false; break;
      case "not": if (matchField(v, arg)) return false; break;
      case "in": if (!(arg as any[]).some((x) => eq(v, x))) return false; break;
      case "notIn": if ((arg as any[]).some((x) => eq(v, x))) return false; break;
      case "contains": if (v == null || !String(v).toLowerCase().includes(String(arg).toLowerCase())) return false; break; // collation MySQL case-insensitive
      case "startsWith": if (v == null || !String(v).toLowerCase().startsWith(String(arg).toLowerCase())) return false; break;
      case "endsWith": if (v == null || !String(v).toLowerCase().endsWith(String(arg).toLowerCase())) return false; break;
      case "gt": if (!(cmp(v, arg) > 0)) return false; break;
      case "gte": if (!(cmp(v, arg) >= 0)) return false; break;
      case "lt": if (!(cmp(v, arg) < 0)) return false; break;
      case "lte": if (!(cmp(v, arg) <= 0)) return false; break;
      default: throw new Error(`mock-db: operator where tidak didukung: ${op}`);
    }
  }
  return true;
}

function matches(row: Row, where?: Row): boolean {
  if (!where) return true;
  for (const [k, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (k === "OR") { if (!(cond as Row[]).some((w) => matches(row, w))) return false; continue; }
    if (k === "AND") { if (![cond].flat().every((w) => matches(row, w as Row))) return false; continue; }
    if (k === "NOT") { if ([cond].flat().some((w) => matches(row, w as Row))) return false; continue; }
    if (!matchField(row[k], cond)) return false;
  }
  return true;
}

function sortRows(rows: Row[], orderBy: any, pk: string): Row[] {
  const keys: [string, 1 | -1][] = [];
  for (const o of [orderBy ?? []].flat()) for (const [f, d] of Object.entries(o as Row)) keys.push([f, d === "desc" ? -1 : 1]);
  const tie: 1 | -1 = keys[0]?.[1] ?? 1;
  return [...rows].sort((a, b) => {
    for (const [f, d] of keys) { const c = cmp(a[f], b[f]); if (c) return c * d; }
    return cmp(a[pk], b[pk]) * tie; // urutan stabil: id mengikuti arah urutan pertama
  });
}

/* ------------------------------------------------------------------ */
/* Pembuat delegate                                                    */
/* ------------------------------------------------------------------ */
function makeDb(store: Store): { db: Db; insert: (m: ModelName, data: Row) => Row } {
  const table = (m: ModelName) => store.tables[m];

  function project(m: ModelName, row: Row, args?: Row): Row {
    const def = DEFS[m];
    const resolve = (name: string, sub: any): Row | null => {
      const r = def.rel?.[name];
      if (!r) throw new Error(`mock-db: relasi ${m}.${name} tidak didukung`);
      const fk = row[r[1]];
      const target = fk == null ? null : table(r[0]).find((x) => x[DEFS[r[0]].pk] === fk);
      if (!target) return null;
      return project(r[0], target, sub && typeof sub === "object" ? sub : undefined);
    };
    if (args?.select) {
      const out: Row = {};
      for (const [k, v] of Object.entries(args.select)) {
        if (!v) continue;
        out[k] = def.rel?.[k] ? resolve(k, v) : row[k];
      }
      return out;
    }
    const out: Row = { ...row };
    if (args?.include) for (const [k, v] of Object.entries(args.include)) if (v) out[k] = resolve(k, v);
    return out;
  }

  function assertUnique(m: ModelName, row: Row, selfPk?: unknown) {
    const def = DEFS[m];
    for (const f of def.unique) {
      if (table(m).some((x) => x[def.pk] !== selfPk && eq(x[f], row[f]) && row[f] != null)) {
        throw new Error(`Unique constraint failed on the fields: (\`${f}\`)`);
      }
    }
    if (!def.autoId && table(m).some((x) => x[def.pk] !== selfPk && x[def.pk] === row[def.pk])) {
      throw new Error(`Unique constraint failed on the fields: (\`${def.pk}\`)`);
    }
  }

  const clean = (d: Row) => Object.fromEntries(Object.entries(d ?? {}).filter(([, v]) => v !== undefined));

  function insert(m: ModelName, data: Row): Row {
    const def = DEFS[m];
    const now = new Date();
    const row: Row = {};
    for (const f of def.nullDefaults) row[f] = null;
    Object.assign(row, def.defaults, clean(data));
    if (def.autoId === "int" && row[def.pk] == null) row[def.pk] = store.counters[m] = (store.counters[m] ?? 0) + 1;
    if (def.autoId === "uuid" && row[def.pk] == null) row[def.pk] = randomUUID();
    if (def.createdAt && !row.createdAt) row.createdAt = now;
    if (def.updatedAt) row.updatedAt = now;
    if (m === "session" && !row.lastActivityAt) row.lastActivityAt = now;
    assertUnique(m, row);
    if (def.autoId === "int" && row[def.pk] > (store.counters[m] ?? 0)) store.counters[m] = row[def.pk];
    table(m).push(row);
    return row;
  }

  function cascade(m: ModelName, removed: Row) {
    for (const rule of ON_DELETE[m] ?? []) {
      const t = table(rule.model);
      if (rule.action === "cascade") {
        for (let i = t.length - 1; i >= 0; i--) if (t[i][rule.field] === removed[DEFS[m].pk]) t.splice(i, 1);
      } else {
        for (const r of t) if (r[rule.field] === removed[DEFS[m].pk]) r[rule.field] = null;
      }
    }
  }

  function remove(m: ModelName, row: Row) {
    const t = table(m);
    t.splice(t.indexOf(row), 1);
    cascade(m, row);
  }

  function delegate(m: ModelName): Delegate<any> {
    const def = DEFS[m];
    const find = (where?: Row) => table(m).find((r) => matches(r, where));
    const many = (args?: Row) => {
      let rows = table(m).filter((r) => matches(r, args?.where));
      rows = sortRows(rows, args?.orderBy, def.pk);
      const skip = args?.skip ?? 0;
      return args?.take != null ? rows.slice(skip, skip + args.take) : rows.slice(skip);
    };
    const patch = (row: Row, data: Row) => {
      const next = { ...row, ...clean(data) };
      assertUnique(m, next, row[def.pk]);
      Object.assign(row, next);
      if (def.updatedAt) row.updatedAt = new Date();
    };
    return {
      async findMany(args) { return many(args).map((r) => project(m, r, args)); },
      async findFirst(args) { const r = many({ ...args, take: 1 })[0]; return r ? project(m, r, args) : null; },
      async findUnique(args) { const r = find(args.where); return r ? project(m, r, args) : null; },
      async count(args) { return table(m).filter((r) => matches(r, args?.where)).length; },
      async create(args) { return project(m, insert(m, args.data), args); },
      async createMany(args) { for (const d of args.data) insert(m, d); return { count: args.data.length }; },
      async update(args) {
        const r = find(args.where);
        if (!r) throw new Error("Record to update not found.");
        patch(r, args.data);
        return project(m, r, args);
      },
      async upsert(args) {
        const r = find(args.where);
        if (r) { patch(r, args.update); return project(m, r, args); }
        return project(m, insert(m, args.create), args);
      },
      async delete(args) {
        const r = find(args.where);
        if (!r) throw new Error("Record to delete does not exist.");
        const out = project(m, r, args);
        remove(m, r);
        return out;
      },
      async deleteMany(args) {
        const rows = table(m).filter((r) => matches(r, args?.where));
        for (const r of rows) remove(m, r);
        return { count: rows.length };
      },
    };
  }

  const db = Object.fromEntries((Object.keys(DEFS) as ModelName[]).map((m) => [m, delegate(m)])) as unknown as Db;
  (db as any).$transaction = async (arg: any) => (typeof arg === "function" ? arg(db) : Promise.all(arg));
  return { db, insert };
}

/* ------------------------------------------------------------------ */
/* Singleton + seed                                                    */
/* ------------------------------------------------------------------ */
export type SeedApi = {
  /** Insert sinkron; mengembalikan baris yang dibuat (untuk mengambil id). */
  insert: (model: ModelName, data: Row) => Row;
  putFile: (storageKey: string, data: Buffer) => void;
};

function boot() {
  if (!g.__apexMock) {
    const store = newStore();
    const { db, insert } = makeDb(store);
    g.__apexMock = { store, db };
    buildSeed({ insert, putFile: (key, buf) => store.files.set(key, buf) });
  }
  return g.__apexMock;
}

const mock = boot();

/** Database tiruan: nama `prisma` dipertahankan agar kode lama tetap berjalan tanpa perubahan. */
export const prisma: Db = mock.db;

/** Penyimpanan file upload (pengganti disk): storageKey -> isi file. */
export const fileStore: Map<string, Buffer> = mock.store.files;
