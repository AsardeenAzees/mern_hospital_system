import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient.js';

dotenv.config();

const migratePatients = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all patients without patientId
        const patients = await Patient.find({ patientId: { $exists: false } });
        console.log(`Found ${patients.length} patients to migrate`);

        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            
            // Generate patient ID
            const lastPatient = await Patient.findOne({}, {}, { sort: { 'patientId': -1 } });
            let nextNumber = 1;
            if (lastPatient && lastPatient.patientId) {
                const match = lastPatient.patientId.match(/PT(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            const patientId = `PT${nextNumber.toString().padStart(4, '0')}`;

            // Update patient with new fields
            await Patient.findByIdAndUpdate(patient._id, {
                $set: {
                    patientId: patientId,
                    email: patient.email || null,
                    nic: patient.nic || `NIC${patientId}` // Generate a placeholder NIC if not exists
                }
            });

            console.log(`Migrated patient ${patient.firstName} ${patient.lastName} with ID: ${patientId}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

migratePatients();
