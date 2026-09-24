# Pills API

REST API penjadwalan minum obat. Dokter mengelola pasien dan jadwal obatnya, pasien melihat
jadwalnya sendiri, dan dispenser obat mengambil jadwal yang jatuh tempo lewat API key.

**Tech stack:** NestJS 12, Prisma 7 + PostgreSQL, JWT (passport-jwt), Jest + Supertest.

## Pattern

Project ini memakai **modular + layered architecture** bawaan NestJS. Setiap fitur (`auth`,
`patients`, `schedules`, `hardware`) adalah satu module berisi:

- **Controller**: menerima request dan memanggil service
- **Service**: logika bisnis
- **DTO**: validasi input dengan `class-validator`

Guard dan decorator yang dipakai bersama (JWT, role, API key) ada di `src/common`.

**Alasannya:**

- Sesuai cara kerja NestJS, sehingga strukturnya mudah dipahami developer lain.
- Tanggung jawab terpisah jelas: controller tetap tipis, aturan bisnis hanya di service.
- Mudah diuji, karena dependensi disuntikkan lewat dependency injection dan bisa diganti tiruan.
- Mudah dikembangkan: fitur baru cukup ditambahkan sebagai module baru.

## Menjalankan

Prasyarat: Node.js 22.12+ dan PostgreSQL.

```bash
npm install
cp .env.example .env          # isi nilainya
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

API berjalan di `http://localhost:3000`.

## Endpoint

| Method | Path | Akses |
| --- | --- | --- |
| POST | `/auth/register` | publik (dokter) |
| POST | `/auth/register/patient` | publik (pasien) |
| GET | `/auth/doctors` | publik |
| POST | `/auth/login` | publik |
| GET | `/auth/me` | JWT |
| GET, POST | `/patients` | JWT, DOCTOR |
| GET, PATCH, DELETE | `/patients/:id` | JWT, DOCTOR |
| GET, POST | `/schedules` | JWT, DOCTOR |
| GET, PATCH, DELETE | `/schedules/:id` | JWT, DOCTOR |
| GET | `/schedules/mine` | JWT, PATIENT |
| GET | `/hardware/check-schedule` | header `x-api-key` |

Kirim token dengan header `Authorization: Bearer <access_token>`.

## Testing

```bash
npm test            # unit test
npm run test:e2e    # e2e test token JWT (butuh PostgreSQL berjalan)
```

## Dokumentasi API

- **Swagger:** `http://localhost:3000/api`
- **Postman:** import `pills.postman_collection.json`
