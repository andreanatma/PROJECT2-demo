/**
 * Data awal mode demo (disalin dari prisma/seed.ts sebelumnya) + gambar sampul SVG, pesan kontak contoh,
 * dan satu akun Super Admin demo supaya dashboard bisa langsung dicoba.
 */
import bcrypt from "bcryptjs";
import type { SeedApi } from "./mock-db";

const adminOn = (process.env.DEMO_SEED_ADMIN ?? "true").toLowerCase() !== "false";
export const DEMO_ADMIN = {
  enabled: adminOn,
  name: process.env.DEMO_ADMIN_NAME || "Super Admin Demo",
  email: (process.env.DEMO_ADMIN_EMAIL || "admin@apex-demo.test").toLowerCase(),
  password: process.env.DEMO_ADMIN_PASSWORD || "Demo-Admin-2026",
  /** true bila memakai kredensial bawaan (ditampilkan sebagai petunjuk di halaman login). */
  isDefault: !process.env.DEMO_ADMIN_PASSWORD,
};

const services = [
  ["Enterprise Cloud Architecture & Migration", "Modernisasi infrastruktur on-premise ke hybrid atau multi-cloud dengan skalabilitas instan, migrasi tanpa downtime, dan optimasi biaya komputasi (FinOps)."],
  ["Custom SaaS & Enterprise Software Engineering", "Pembangunan aplikasi web dan sistem internal berskala enterprise dengan arsitektur modular, pipeline CI/CD otomatis, dan kode teruji."],
  ["AI, Machine Learning & Big Data Analytics", "Mengubah data bisnis menjadi keunggulan prediktif melalui pipeline machine learning produksi, integrasi LLM korporasi, dan dashboard real-time."],
  ["Cyber Security & Compliance Audit", "Proteksi perimeter berlapis, pengujian penetrasi, desain zero-trust, dan persiapan audit ISO 27001 serta SOC 2."],
  ["DevOps Automation & Reliability (SRE)", "Mempercepat rilis dengan Infrastructure as Code, GitOps, observabilitas telemetri, dan simulasi chaos engineering."],
  ["IT Strategy Consulting & Transformation", "Pendampingan eksekutif untuk peta jalan teknologi, tata kelola IT, audit arsitektur legacy, dan mitigasi risiko teknis."],
];
const products = [
  ["ApexCore ERP Cloud", "Sistem ERP terpadu dengan multi-entity ledger, kepatuhan pajak terintegrasi, dan rekonsiliasi keuangan multi-valuta.", "Throughput: 10.000+ transaksi/detik\nKonsolidasi: Multi-entity\nAPI: REST & GraphQL\nDeployment: Cloud managed atau on-premise"],
  ["ApexSentinel IoT Gateway", "Edge gateway untuk monitoring puluhan ribu sensor pabrik secara real-time dengan enkripsi hardware TPM 2.0.", "Protokol: MQTT, CoAP, Modbus\nKeamanan: TPM 2.0\nOffline: Buffer & auto-sync\nEdge AI: Inference node"],
  ["ApexVault CyberShield", "Tata kelola identitas dan akses zero-trust dengan deteksi anomali berbasis machine learning.", "Autentikasi: FIDO2 / Passkey\nOtorisasi: RBAC & ABAC\nAudit: Access certification otomatis\nKepatuhan: ISO 27001"],
  ["ApexFlow Data Pipeline", "Orkestrasi pipeline data streaming berkapasitas besar menuju data lakehouse dan model analitik prediktif.", "Streaming: Apache Kafka & Iceberg\nThroughput: 5+ GB/detik\nSchema: Registry otomatis\nGaransi: Zero data loss"],
];
const portfolio = [
  ["Modernisasi Core Banking & Multi-Cloud Resiliency", "Transisi arsitektur monolitik perbankan ke microservices Kubernetes multi-cloud dengan audit PCI-DSS dan peralihan tanpa downtime."],
  ["Telemetri Armada Kontainer Otomatis", "Platform ingestion data sensor GPS dan suhu untuk 12.000 kontainer lintas samudra secara real-time."],
  ["Smart Grid Predictive Analytics", "Pipeline machine learning untuk memprediksi fluktuasi beban pembangkit surya dan mendeteksi anomali gardu induk."],
];
const gallery = [
  ["Apex R&D Innovation Lab", "Fasilitas pengujian performa microservices dan validasi jaringan zero-trust."],
  ["Apex Annual Tech Summit", "Konferensi tahunan pengembang dan mitra industri."],
  ["Agile Collaboration Hub", "Ruang kolaborasi tim lintas fungsi."],
];
const team = [["Nama Direktur Utama", "Chief Executive Officer"], ["Nama CTO", "Chief Technology Officer"], ["Nama Kepala Keamanan", "VP of Cyber Security"], ["Nama Kepala AI", "Head of AI & Analytics"]];
const blogs = [
  ["Strategi Multi-Cloud Tanpa Vendor Lock-in", "Panduan praktis mengadopsi abstraksi infrastruktur berbasis Kubernetes.", "Banyak organisasi terjebak pada satu penyedia cloud karena ketergantungan layanan terkelola.\n\n## Mulai dari abstraksi\n\nGunakan Kubernetes dan Infrastructure as Code agar beban kerja dapat dipindahkan antar penyedia.\n\n## Ukur biaya perpindahan\n\nHitung biaya egress dan rekayasa ulang sebelum memutuskan arsitektur."],
  ["Mempersiapkan Audit ISO 27001:2022 di Lingkungan Cloud", "Daftar periksa kontrol teknis zero-trust dan pelaporan kepatuhan.", "Audit berjalan lancar bila kontrol teknis dan dokumentasi dibangun sejak awal.\n\n## Kontrol yang sering ditanyakan\n\nManajemen akses, enkripsi data, pencatatan log, dan prosedur pemulihan bencana."],
];
const messages: [string, string, string, "UNREAD" | "READ" | "REPLIED", number][] = [
  ["Budi Santoso", "budi@contoh-perusahaan.co.id", "Kami tertarik dengan layanan migrasi cloud untuk 40 server on-premise. Bisakah dijadwalkan sesi konsultasi minggu depan?", "UNREAD", 1],
  ["Dewi Lestari", "dewi@contoh-retail.id", "Mohon informasi lisensi dan harga ApexCore ERP Cloud untuk 3 entitas bisnis.", "READ", 3],
  ["Rizky Pratama", "rizky@contoh-logistik.com", "Terima kasih atas presentasinya kemarin. Kami ingin melanjutkan ke tahap proof of concept.", "REPLIED", 6],
];

const slug = (s: string) => s.normalize("NFKD").toLowerCase().replace(/&/g, " dan ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MIN = 60_000, DAY = 86_400_000;

export function buildSeed(api: SeedApi) {
  const now = Date.now();
  let fileNo = 0;
  let hue = 205;

  /** Gambar sampul SVG sederhana agar tampilan demo tidak kosong. */
  const cover = (label: string): number => {
    hue = (hue + 37) % 360;
    const text = esc(label.length > 34 ? label.slice(0, 33) + "…" : label);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 42%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 22%)"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="660" cy="120" r="150" fill="#fff" fill-opacity=".08"/><circle cx="130" cy="420" r="110" fill="#fff" fill-opacity=".06"/><text x="40" y="450" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#fff" fill-opacity=".92">${text}</text></svg>`;
    const buf = Buffer.from(svg, "utf8");
    const key = `demo/${String(++fileNo).padStart(3, "0")}.svg`;
    api.putFile(key, buf);
    return api.insert("mediaFile", { storageKey: key, originalName: `${slug(label) || "cover"}.svg`, mimeType: "image/svg+xml", sizeBytes: buf.length, isPublic: true, createdAt: new Date(now - (200 - fileNo) * MIN) }).id;
  };
  const at = (i: number, total: number) => new Date(now - (total - i) * 5 * MIN); // urutan insert = urutan waktu

  services.forEach(([name, description], i) => api.insert("service", { name, slug: slug(name), description, imageId: cover(name), createdAt: at(i, services.length) }));
  products.forEach(([name, description, specifications], i) => api.insert("product", { name, slug: slug(name), description, specifications, imageId: cover(name), createdAt: at(i, products.length) }));
  portfolio.forEach(([name, description], i) => api.insert("portfolio", { name, slug: slug(name), description, imageId: cover(name), projectDate: new Date(now - (i + 1) * 60 * DAY), createdAt: at(i, portfolio.length) }));
  gallery.forEach(([title, description], i) => api.insert("gallery", { title, description, imageId: cover(title), createdAt: at(i, gallery.length) }));
  team.forEach(([name, position], i) => api.insert("teamMember", { name, position, photoId: cover(name), displayOrder: i, createdAt: at(i, team.length) }));
  blogs.forEach(([title, excerpt, content], i) => api.insert("blog", { title, slug: slug(title), excerpt, content, featuredImageId: cover(title), status: "PUBLISHED", publishedAt: new Date(now - (i + 1) * 4 * DAY), createdAt: at(i, blogs.length) }));

  let adminId: number | null = null;
  if (DEMO_ADMIN.enabled) {
    adminId = api.insert("user", { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email, passwordHash: bcrypt.hashSync(DEMO_ADMIN.password, 10), role: "SUPER_ADMIN" }).id;
    api.insert("activityLog", { userId: adminId, action: "CREATE", entity: "users", entityId: String(adminId), summary: "Akun Super Admin demo dibuat otomatis (mode demo tanpa database)", ipAddress: "127.0.0.1" });
  }
  messages.forEach(([name, email, message, status, daysAgo]) => api.insert("contactMessage", { name, email, message, status, createdAt: new Date(now - daysAgo * DAY) }));
}
