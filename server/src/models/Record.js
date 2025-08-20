import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
    type: { type: String, enum: ['DIAGNOSIS', 'TEST_RESULT', 'PRESCRIPTION', 'NOTE'], required: true },
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{
        name: String, url: String
    }]
}, { timestamps: true });

const recordSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    entries: [entrySchema]
}, { timestamps: true });

export default mongoose.model('Record', recordSchema);
