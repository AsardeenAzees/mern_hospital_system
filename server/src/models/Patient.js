import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin/reception
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dob: { type: Date, required: true },
    phone: { type: String },
    email: { type: String, lowercase: true, trim: true }, // optional
    nic: { type: String, required: true, trim: true, index: true }, // National ID (required)
    patientId: { type: String, required: true, unique: true, index: true }, // e.g., PT000001
    allergies: [{ type: String }],
    medicalHistory: { type: String }, // free text
    qr: {
        token: { type: String, index: true, unique: true },   // opaque token shown in QR
        imageDataUrl: { type: String }                      // optional (data URL for download/print)
    },
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // optional if patient also has login
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);
