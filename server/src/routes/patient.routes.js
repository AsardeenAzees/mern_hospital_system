import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import Patient from '../models/Patient.js';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';

const router = Router();

import Record from '../models/Record.js';
import User from '../models/User.js';

// Create patient (ADMIN/Reception)
router.post('/patients', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    try {
        const { firstName, lastName, gender, dob, phone, allergies, medicalHistory, email, nic } = req.body;
        
        if (!firstName || !lastName || !gender || !dob || !nic) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Generate unique token for QR
        const token = uuid();
        const payload = JSON.stringify({ t: token });
        const dataUrl = await QRCode.toDataURL(payload, { margin: 1, scale: 6 });

        // Generate next patientId in sequence PT000001
        const last = await Patient.findOne({}).sort({ createdAt: -1 }).select('patientId').lean();
        let nextNum = 1;
        if (last?.patientId) {
            const match = last.patientId.match(/PT(\d{6})/);
            if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        const patientId = `PT${String(nextNum).padStart(6, '0')}`;

        // Ensure uniqueness (rare race condition)
        const exists = await Patient.findOne({ patientId }).lean();
        if (exists) {
            return res.status(409).json({ message: 'Patient ID collision. Please retry.' });
        }

        const patient = await Patient.create({
            createdBy: req.user.id,
            firstName,
            lastName,
            gender,
            dob: new Date(dob),
            phone,
            email,
            nic,
            patientId,
            allergies: Array.isArray(allergies) ? allergies : (allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : []),
            medicalHistory,
            qr: { token, imageDataUrl: dataUrl }
        });

        res.status(201).json({ 
            message: 'Patient created successfully',
            patient: {
                id: patient._id,
                patientId: patient.patientId,
                firstName: patient.firstName,
                lastName: patient.lastName,
                qr: patient.qr
            }
        });
    } catch (error) {
        console.error('Patient creation error:', error);
        res.status(500).json({ message: 'Failed to create patient', error: error.message });
    }
});

// Create patient (ADMIN/Reception)
// REPLACE the old GET /patients with this enhanced version
router.get('/patients', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1)
    const q = (req.query.q || '').trim()

    const match = q
        ? {
            $or: [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
            ]
        }
        : {}

    const total = await Patient.countDocuments(match)
    const patients = await Patient.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('firstName lastName gender dob phone createdAt qr.token') // include token (no image)

    res.json({
        total,
        page,
        limit,
        patients
    })
})





// Resolve token -> patient minimal profile (DOCTOR/NURSE can see; PATIENT cannot)
router.get('/patients/resolve', requireAuth, allowRoles('DOCTOR', 'NURSE', 'ADMIN'), async (req, res) => {
    const { t } = req.query; // token from QR
    if (!t) return res.status(400).json({ message: 'Missing token' });

    const patient = await Patient.findOne({ 'qr.token': t }).select('-qr.imageDataUrl');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    res.json({
        patient: {
            id: patient._id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            gender: patient.gender,
            dob: patient.dob,
            allergies: patient.allergies ?? [],
            medicalHistory: patient.medicalHistory ?? ''
        }
    });
});

// Get full patient by id (ADMIN, DOCTOR/NURSE; PATIENT only if userRef matches)
router.get('/patients/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const p = await Patient.findById(id);
    if (!p) return res.status(404).json({ message: 'Not found' });

    const role = req.user.role;
    const isSelf = p.userRef?.toString() === req.user.id || req.user.id === id; // allow PatientID+NIC session

    if (role === 'PATIENT' && !isSelf) return res.status(403).json({ message: 'Forbidden' });
    if (!['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'].includes(role)) return res.status(403).json({ message: 'Forbidden' });

    res.json({ patient: p });
});

// Delete patient (Admin)
router.delete('/patients/:id', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await Record.deleteMany({ patientId: patient._id });

        if (patient.userRef) {
            await User.findByIdAndDelete(patient.userRef);
        }

        await patient.deleteOne();

        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Patient deletion error:', error);
        res.status(500).json({ message: 'Failed to delete patient' });
    }
});

// Rotate QR token (Admin)
router.post('/patients/:id/rotate-token', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const { id } = req.params;
    const p = await Patient.findById(id);
    if (!p) return res.status(404).json({ message: 'Patient not found' });

    const token = uuid();
    const dataUrl = await QRCode.toDataURL(JSON.stringify({ t: token }), { margin: 1, scale: 6 });

    p.qr.token = token;
    p.qr.imageDataUrl = dataUrl;
    await p.save();

    res.json({ message: 'QR token rotated', qr: p.qr });
});




// Admin list with search & pagination
router.get('/patients/admin/list', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const q = (req.query.q || '').trim();

    const filter = q ? {
        $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { 'qr.token': { $regex: q, $options: 'i' } }
        ]
    } : {};

    const [total, patients] = await Promise.all([
        Patient.countDocuments(filter),
        Patient.find(filter)
            .select('firstName lastName gender dob phone allergies qr.token createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
    ]);

    res.json({ total, page, limit, pages: Math.ceil(total / limit), patients });
});

// Download QR as PNG (Admin)
router.get('/patients/:id/qr.png', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Patient not found' });

    // if dataUrl missing (older rows), regenerate from token
    let dataUrl = p.qr?.imageDataUrl;
    if (!dataUrl && p.qr?.token) {
        const png = await QRCode.toDataURL(JSON.stringify({ t: p.qr.token }), { margin: 1, scale: 6 });
        dataUrl = png;
        p.qr.imageDataUrl = png;
        await p.save();
    }
    if (!dataUrl) return res.status(400).json({ message: 'No QR available' });

    const base64 = dataUrl.split(',')[1];
    const buf = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${p.firstName}-${p.lastName}-qr.png"`);
    res.end(buf);
});


export default router;

