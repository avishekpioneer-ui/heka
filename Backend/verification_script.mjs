import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const verifyEndpoint = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find an admin user
        const adminUser = await User.findOne({ category: 'admin' });

        if (!adminUser) {
            console.error('No admin user found. Please seed the database first.');
            process.exit(1);
        }

        console.log(`Found admin user: ${adminUser.email} (${adminUser._id})`);

        // Call the API
        const response = await axios.get('http://localhost:5000/api/admin/users', {
            headers: {
                'x-user-id': adminUser._id.toString()
            }
        });

        if (response.status === 200 && response.data.users) {
            console.log('✅ Endpoint verification successful!');
            console.log(`Retrieved ${response.data.count} users.`);
            console.log('First user:', response.data.users[0]);
        } else {
            console.error('❌ Endpoint verification failed.');
            console.log('Status:', response.status);
            console.log('Data:', response.data);
        }

    } catch (error) {
        console.error('❌ Error verifying endpoint:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    } finally {
        await mongoose.disconnect();
    }
};

verifyEndpoint();
