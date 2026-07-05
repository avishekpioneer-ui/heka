import OpdPatient from "../models/OpdPatient.js";

export const registerPatient = async (req, res) => {
    try {
        const { name, phone, email, gender, age, address } = req.body;

        if (!name || !phone || !gender || !age) {
            return res.status(400).json({ message: "Name, phone, gender, and age are required" });
        }

        const existingPatient = await OpdPatient.findOne({ phone: phone.trim() });
        if (existingPatient) {
            return res.status(409).json({
                message: "A patient with this phone number is already registered",
                patient: existingPatient
            });
        }

        const patient = await OpdPatient.create({
            name,
            phone,
            email,
            gender,
            age,
            address
        });

        res.status(201).json({ message: "Patient registered successfully", patient });
    } catch (error) {
        console.error("Register Patient Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPatients = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } }
                ]
            };
        }

        const patients = await OpdPatient.find(query).sort({ createdAt: -1 });
        res.status(200).json(patients);
    } catch (error) {
        console.error("Get Patients Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await OpdPatient.findById(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        res.status(200).json(patient);
    } catch (error) {
        console.error("Get Patient By ID Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPatient = await OpdPatient.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        res.status(200).json({ message: "Patient updated successfully", patient: updatedPatient });
    } catch (error) {
        console.error("Update Patient Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await OpdPatient.findByIdAndDelete(id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }
        res.status(200).json({ message: "Patient deleted successfully" });
    } catch (error) {
        console.error("Delete Patient Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
