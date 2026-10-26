import "server-only";

// MODE DEMO: tidak ada database. `prisma` kini adalah database tiruan in-memory (lihat ./mock-db),
// dengan API yang sama sehingga seluruh halaman dan server action tetap berjalan tanpa perubahan.
export { prisma } from "./mock-db";
