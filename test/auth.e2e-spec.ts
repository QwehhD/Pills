import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('JWT token (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;

  const runId = Date.now();
  const doctor = {
    name: 'dr E2E',
    email: `e2e-doctor-${runId}@pills.id`,
    password: 'password123',
  };
  const patient = {
    name: 'Pasien E2E',
    email: `e2e-patient-${runId}@pills.id`,
    password: 'password123',
    age: 40,
    disease: 'Hipertensi',
    phone: '081234567890',
  };

  let doctorId: string;
  let doctorToken: string;
  let patientToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [doctor.email, patient.email] } },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('201: membuat dokter tanpa membocorkan password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(doctor)
        .expect(201);

      expect(res.body).toMatchObject({ email: doctor.email, role: 'DOCTOR' });
      expect(res.body).not.toHaveProperty('password');
      doctorId = res.body.id;
    });

    it('409: email yang sama ditolak', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send(doctor)
        .expect(409));

    it('400: menyelipkan role ditolak', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...doctor, email: `e2e-lain-${runId}@pills.id`, role: 'PATIENT' })
        .expect(400));
  });

  describe('POST /auth/login', () => {
    it('200: mengembalikan access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: doctor.email, password: doctor.password })
        .expect(200);

      expect(typeof res.body.access_token).toBe('string');
      doctorToken = res.body.access_token;
    });

    it('401: password salah', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: doctor.email, password: 'salah12345' })
        .expect(401));
  });

  describe('GET /auth/me', () => {
    it('401: tanpa token', () =>
      request(app.getHttpServer()).get('/auth/me').expect(401));

    it('401: token asal-asalan', () =>
      request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer ini.token.palsu')
        .expect(401));

    it('401: token ditandatangani secret lain', () => {
      const forged = new JwtService({ secret: 'bukan-secret-server' }).sign({
        sub: doctorId,
        email: doctor.email,
        role: 'DOCTOR',
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it('401: token kedaluwarsa', async () => {
      const expired = await jwt.signAsync(
        { sub: doctorId, email: doctor.email, role: 'DOCTOR' },
        { expiresIn: -60 },
      );

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('200: token valid mengembalikan profil', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: doctorId, role: 'DOCTOR' });
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('akses berdasarkan role', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register/patient')
        .send({ ...patient, doctor_id: doctorId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: patient.email, password: patient.password })
        .expect(200);

      patientToken = res.body.access_token;
    });

    it('403: token pasien ke /patients', () =>
      request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403));

    it('200: token dokter ke /patients berisi pasiennya', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({ email: patient.email }),
      ]);
    });

    it('200: token pasien ke /schedules/mine', () =>
      request(app.getHttpServer())
        .get('/schedules/mine')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200));
  });

  describe('hardware', () => {
    it('401: tanpa x-api-key', () =>
      request(app.getHttpServer())
        .get('/hardware/check-schedule')
        .expect(401));
  });
});