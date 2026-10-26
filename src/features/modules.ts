export type FieldType = "text" | "textarea" | "slug" | "image" | "pdf" | "date" | "number" | "select" | "longtext";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  rows?: number;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
  group?: "seo";
};

export type ColumnDef = { key: string; label: string; kind?: "text" | "image" | "date" | "status" };

export type ModuleKey = "services" | "products" | "portfolio" | "gallery" | "our-team" | "blogs";

export type ModuleDef = {
  key: ModuleKey;
  model: "service" | "product" | "portfolio" | "gallery" | "teamMember" | "blog";
  label: string;
  singular: string;
  nameField: string;
  slugSource?: string;
  searchFields: string[];
  orderBy: Record<string, "asc" | "desc">;
  mediaFields: string[]; // kolom FK ke media_files
  publicPaths: string[];
  columns: ColumnDef[];
  fields: FieldDef[];
};

const seo: FieldDef[] = [
  { name: "metaTitle", label: "Meta title", type: "text", max: 160, group: "seo", help: "Kosongkan untuk memakai judul utama." },
  { name: "metaDescription", label: "Meta description", type: "textarea", max: 320, rows: 3, group: "seo" },
];

export const MODULES: Record<ModuleKey, ModuleDef> = {
  services: {
    key: "services", model: "service", label: "Services", singular: "layanan", nameField: "name", slugSource: "name",
    searchFields: ["name", "description"], orderBy: { createdAt: "desc" }, mediaFields: ["imageId"], publicPaths: ["/", "/service"],
    columns: [{ key: "imageId", label: "Gambar", kind: "image" }, { key: "name", label: "Nama" }, { key: "slug", label: "Slug" }, { key: "updatedAt", label: "Diperbarui", kind: "date" }],
    fields: [
      { name: "name", label: "Nama layanan", type: "text", required: true, max: 160 },
      { name: "slug", label: "Slug", type: "slug", max: 190, help: "Kosongkan untuk dibuat otomatis dari nama." },
      { name: "description", label: "Deskripsi", type: "textarea", required: true, max: 5000, rows: 6 },
      { name: "imageId", label: "Gambar", type: "image" },
      ...seo,
    ],
  },
  products: {
    key: "products", model: "product", label: "Products", singular: "produk", nameField: "name", slugSource: "name",
    searchFields: ["name", "description"], orderBy: { createdAt: "desc" }, mediaFields: ["imageId", "pdfId"], publicPaths: ["/", "/products"],
    columns: [{ key: "imageId", label: "Gambar", kind: "image" }, { key: "name", label: "Nama" }, { key: "slug", label: "Slug" }, { key: "updatedAt", label: "Diperbarui", kind: "date" }],
    fields: [
      { name: "name", label: "Nama produk", type: "text", required: true, max: 160 },
      { name: "slug", label: "Slug", type: "slug", max: 190 },
      { name: "description", label: "Deskripsi", type: "textarea", required: true, max: 5000, rows: 5 },
      { name: "specifications", label: "Spesifikasi", type: "textarea", max: 5000, rows: 6, help: "Satu spesifikasi per baris. Gunakan format 'Label: nilai' agar tampil sebagai tabel." },
      { name: "imageId", label: "Gambar", type: "image" },
      { name: "pdfId", label: "Dokumen PDF", type: "pdf" },
      ...seo,
    ],
  },
  portfolio: {
    key: "portfolio", model: "portfolio", label: "Portfolio", singular: "proyek", nameField: "name", slugSource: "name",
    searchFields: ["name", "description"], orderBy: { createdAt: "desc" }, mediaFields: ["imageId"], publicPaths: ["/", "/portfolio"],
    columns: [{ key: "imageId", label: "Gambar", kind: "image" }, { key: "name", label: "Nama" }, { key: "projectDate", label: "Tanggal proyek", kind: "date" }, { key: "updatedAt", label: "Diperbarui", kind: "date" }],
    fields: [
      { name: "name", label: "Nama proyek", type: "text", required: true, max: 160 },
      { name: "slug", label: "Slug", type: "slug", max: 190 },
      { name: "description", label: "Deskripsi", type: "textarea", required: true, max: 5000, rows: 6 },
      { name: "projectDate", label: "Tanggal proyek", type: "date" },
      { name: "imageId", label: "Gambar", type: "image" },
    ],
  },
  gallery: {
    key: "gallery", model: "gallery", label: "Gallery", singular: "foto", nameField: "title",
    searchFields: ["title", "description"], orderBy: { createdAt: "desc" }, mediaFields: ["imageId"], publicPaths: ["/", "/gallery"],
    columns: [{ key: "imageId", label: "Gambar", kind: "image" }, { key: "title", label: "Judul" }, { key: "updatedAt", label: "Diperbarui", kind: "date" }],
    fields: [
      { name: "title", label: "Judul", type: "text", required: true, max: 160 },
      { name: "description", label: "Deskripsi", type: "textarea", max: 2000, rows: 4 },
      { name: "imageId", label: "Gambar", type: "image", required: true },
    ],
  },
  "our-team": {
    key: "our-team", model: "teamMember", label: "Our Team", singular: "anggota tim", nameField: "name",
    searchFields: ["name", "position"], orderBy: { displayOrder: "asc" }, mediaFields: ["photoId"], publicPaths: ["/", "/our-team"],
    columns: [{ key: "photoId", label: "Foto", kind: "image" }, { key: "name", label: "Nama" }, { key: "position", label: "Jabatan" }, { key: "displayOrder", label: "Urutan" }],
    fields: [
      { name: "name", label: "Nama", type: "text", required: true, max: 160 },
      { name: "position", label: "Jabatan", type: "text", required: true, max: 160 },
      { name: "photoId", label: "Foto", type: "image" },
      { name: "displayOrder", label: "Urutan tampil", type: "number", help: "Angka lebih kecil tampil lebih dulu." },
    ],
  },
  blogs: {
    key: "blogs", model: "blog", label: "Blogs", singular: "artikel", nameField: "title", slugSource: "title",
    searchFields: ["title", "excerpt"], orderBy: { createdAt: "desc" }, mediaFields: ["featuredImageId"], publicPaths: ["/", "/blogs"],
    columns: [{ key: "featuredImageId", label: "Gambar", kind: "image" }, { key: "title", label: "Judul" }, { key: "status", label: "Status", kind: "status" }, { key: "publishedAt", label: "Terbit", kind: "date" }],
    fields: [
      { name: "title", label: "Judul", type: "text", required: true, max: 220 },
      { name: "slug", label: "Slug", type: "slug", max: 250 },
      { name: "excerpt", label: "Ringkasan", type: "textarea", max: 400, rows: 3 },
      { name: "content", label: "Isi artikel", type: "longtext", required: true, max: 100000, rows: 16, help: "Pisahkan paragraf dengan baris kosong. Awali baris dengan '## ' untuk subjudul. HTML tidak diproses." },
      { name: "featuredImageId", label: "Gambar utama", type: "image" },
      { name: "status", label: "Status", type: "select", required: true, options: [{ value: "DRAFT", label: "Draft" }, { value: "PUBLISHED", label: "Published" }] },
      { name: "publishedAt", label: "Tanggal terbit", type: "date", help: "Kosongkan untuk memakai tanggal saat dipublikasikan." },
      ...seo,
    ],
  },
};

/** URL halaman publik untuk sebuah data, atau null bila tidak tampil di publik (mis. blog Draft). */
export function publicUrlFor(key: ModuleKey, row: Record<string, unknown>): string | null {
  switch (key) {
    case "services": return `/service#${row.slug}`;
    case "products": return `/products/${row.slug}`;
    case "portfolio": return "/portfolio";
    case "gallery": return "/gallery";
    case "our-team": return "/our-team";
    case "blogs": return row.status === "PUBLISHED" ? `/blogs/${row.slug}` : null;
  }
}

export const MODULE_LIST = Object.values(MODULES);
export function getModule(key: string): ModuleDef | null {
  return (MODULES as Record<string, ModuleDef>)[key] ?? null;
}
