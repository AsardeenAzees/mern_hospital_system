import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import Record from '../models/Record.js';
import Patient from '../models/Patient.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per entry
    },
    fileFilter: (req, file, cb) => {
        // Allow common document and image types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'text/plain'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, and TXT files are allowed.'), false);
        }
    }
});

// Get records for a patient
router.get('/records/:patientId', requireAuth, async (req, res) => {
    try {
        const { patientId } = req.params;
        const p = await Patient.findById(patientId);
        if (!p) return res.status(404).json({ message: 'Patient not found' });

        const role = req.user.role;
        const isSelf = p.userRef?.toString() === req.user.id;

        if (role === 'PATIENT' && !isSelf) return res.status(403).json({ message: 'Forbidden' });

        const rec = await Record
            .findOne({ patientId })
            .populate('entries.author', 'name role')
            .lean();
        
        res.json({ record: rec ?? { patientId, entries: [] } });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ message: 'Failed to fetch records' });
    }
});

// Add new record entry (Doctor/Admin only)
router.post('/records/:patientId/entries', 
    requireAuth, 
    allowRoles('DOCTOR', 'ADMIN'),
    upload.array('attachments', 5), // Handle up to 5 files
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const { type, text } = req.body;

            if (!type || !text) return res.status(400).json({ message: 'type and text are required' });

            const allowedTypes = ['DIAGNOSIS', 'TEST_RESULT', 'PRESCRIPTION', 'NOTE'];
            if (!allowedTypes.includes(type)) return res.status(400).json({ message: 'Invalid type' });

            const p = await Patient.findById(patientId);
            if (!p) return res.status(404).json({ message: 'Patient not found' });

            let rec = await Record.findOne({ patientId });
            if (!rec) rec = await Record.create({ patientId, entries: [] });

            // Process file attachments
            const attachments = [];
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    // In a production environment, you'd save files to cloud storage
                    // For now, we'll store basic file info
                    attachments.push({
                        name: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        // In production: url: await uploadToCloudStorage(file)
                        url: `/api/files/${file.filename || Date.now()}` // Placeholder
                    });
                });
            }

            // Create new entry
            const newEntry = {
                type,
                text,
                author: req.user.id,
                attachments,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            rec.entries.push(newEntry);
            await rec.save();

            // Populate author info for response
            const populatedRec = await Record
                .findOne({ patientId })
                .populate('entries.author', 'name role');

            res.status(201).json({ 
                message: 'Record entry added successfully',
                record: populatedRec 
            });
        } catch (error) {
            console.error('Error adding record entry:', error);
            res.status(500).json({ message: 'Failed to add record entry' });
        }
    }
);

// Get record entry by ID (for editing/viewing specific entries)
router.get('/records/:patientId/entries/:entryId', requireAuth, async (req, res) => {
    try {
        const { patientId, entryId } = req.params;
        
        const record = await Record.findOne({ patientId });
        if (!record) return res.status(404).json({ message: 'Record not found' });

        const entry = record.entries.id(entryId);
        if (!entry) return res.status(404).json({ message: 'Entry not found' });

        // Check permissions
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const role = req.user.role;
        const isSelf = patient.userRef?.toString() === req.user.id;

        if (role === 'PATIENT' && !isSelf) return res.status(403).json({ message: 'Forbidden' });

        res.json({ entry });
    } catch (error) {
        console.error('Error fetching record entry:', error);
        res.status(500).json({ message: 'Failed to fetch record entry' });
    }
});

// Update record entry (Doctor/Admin only)
router.patch('/records/:patientId/entries/:entryId', 
    requireAuth, 
    allowRoles('DOCTOR', 'ADMIN'),
    async (req, res) => {
        try {
            const { patientId, entryId } = req.params;
            const { text } = req.body;

            if (!text) return res.status(400).json({ message: 'text is required' });

            const record = await Record.findOne({ patientId });
            if (!record) return res.status(404).json({ message: 'Record not found' });

            const entry = record.entries.id(entryId);
            if (!entry) return res.status(404).json({ message: 'Entry not found' });

            // Only allow editing entries created by the current user
            if (entry.author.toString() !== req.user.id) {
                return res.status(403).json({ message: 'You can only edit your own entries' });
            }

            entry.text = text;
            entry.updatedAt = new Date();
            await record.save();

            res.json({ 
                message: 'Entry updated successfully',
                entry 
            });
        } catch (error) {
            console.error('Error updating record entry:', error);
            res.status(500).json({ message: 'Failed to update record entry' });
        }
    }
);

export default router;
