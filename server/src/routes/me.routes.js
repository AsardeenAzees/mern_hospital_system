import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import Patient from '../models/Patient.js';
import Record from '../models/Record.js';

const router = Router();

// Patient -> their own Patient doc
router.get('/me/patient', requireAuth, allowRoles('PATIENT'), async (req, res) => {
    let p = await Patient.findOne({ userRef: req.user.id });
    if (!p) {
        // Fallback: token may carry patientId (for PatientID+NIC login)
        p = await Patient.findById(req.user.id);
    }
    if (!p) return res.status(404).json({ message: 'No patient linked to this user' });
    res.json({ patient: p });
});

// Patient -> their own Records
router.get('/me/records', requireAuth, allowRoles('PATIENT'), async (req, res) => {
    let p = await Patient.findOne({ userRef: req.user.id });
    if (!p) {
        p = await Patient.findById(req.user.id);
    }
    if (!p) return res.status(404).json({ message: 'No patient linked to this user' });
    const rec = await Record
        .findOne({ patientId: p._id })
        .populate('entries.author', 'name role')
        .lean();
    res.json({ patient: p, record: rec ?? { patientId: p._id, entries: [] } });
});

export default router;
