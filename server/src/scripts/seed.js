import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Record from '../models/Record.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Mongo');

    // Upsert Admin/Doctor/Patient users
    const ensureUser = async (name, email, password, role) => {
        let u = await User.findOne({ email });
        if (!u) {
            u = await User.create({
                name, email, role,
                passwordHash: await bcrypt.hash(password, 10)
            });
            console.log(`Created ${role}: ${email} / ${password}`);
        } else {
            console.log(`Exists ${role}: ${email}`);
        }
        return u;
    };

    const admin = await ensureUser('Admin One', 'admin@h.com', 'Admin@123', 'ADMIN');
    const doctor = await ensureUser('Dr. Smith', 'doc@h.com', 'Doc@123', 'DOCTOR');
    const patientUser = await ensureUser('John Patient', 'patient@h.com', 'Patient@123', 'PATIENT');

    // Create a demo patient + link to patient user
    let p = await Patient.findOne({ userRef: patientUser._id });
    if (!p) {
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
        const payload = JSON.stringify({ t: token });
        const dataUrl = await QRCode.toDataURL(payload, { margin: 1, scale: 6 });

        p = await Patient.create({
            createdBy: admin._id,
            firstName: 'John',
            lastName: 'Patient',
            gender: 'Male',
            dob: new Date('1990-01-01'),
            phone: '0771234567',
            allergies: ['Penicillin'],
            medicalHistory: 'Type 2 Diabetes',
            qr: { token, imageDataUrl: dataUrl },
            userRef: patientUser._id
        });
        console.log('Created demo patient:', p.firstName, p.lastName);

        // Export QR image to project root for easy scanning
        const outPath = path.join(__dirname, '../../seed-patient-qr.png');
        await QRCode.toFile(outPath, payload, { margin: 1, scale: 6 });
        console.log('Wrote QR to:', outPath);
    } else {
        console.log('Demo patient already exists.');
    }

    // Optional: seed one record entry
    let rec = await Record.findOne({ patientId: p._id });
    if (!rec) rec = await Record.create({ patientId: p._id, entries: [] });
    rec.entries.push({ type: 'DIAGNOSIS', text: 'Hypertension - initial dx.', author: doctor._id });
    await rec.save();
    console.log('Seeded one record entry by doctor.');

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
