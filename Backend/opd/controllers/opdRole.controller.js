import OpdRole from "../models/OpdRole.js";
import OpdUser from "../models/OpdUser.js";
import bcrypt from "bcryptjs";

export const VALID_PERMISSIONS = [
    "access_opd",
    "manage_patients",
    "manage_appointments",
    "manage_consultations",
    "manage_tests",
    "manage_medicines",
    "manage_billing",
    "manage_roles"
];

// Roles Management
export const createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Role name is required" });
        }

        if (permissions && permissions.some((p) => !VALID_PERMISSIONS.includes(p))) {
            return res.status(400).json({ message: "One or more permissions are invalid" });
        }

        const existingRole = await OpdRole.findOne({ name });
        if (existingRole) {
            return res.status(409).json({ message: "Role already exists" });
        }

        const newRole = await OpdRole.create({ name, permissions });
        res.status(201).json({ message: "Role created successfully", role: newRole });
    } catch (error) {
        console.error("Create Role Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getRoles = async (req, res) => {
    try {
        const roles = await OpdRole.find({});
        res.status(200).json(roles);
    } catch (error) {
        console.error("Get Roles Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;

        if (permissions && permissions.some((p) => !VALID_PERMISSIONS.includes(p))) {
            return res.status(400).json({ message: "One or more permissions are invalid" });
        }

        const role = await OpdRole.findById(id);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        if (name) role.name = name;
        if (permissions) role.permissions = permissions;

        await role.save();
        res.status(200).json({ message: "Role updated successfully", role });
    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await OpdRole.findByIdAndDelete(id);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }
        res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Delete Role Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Staff Management
export const createStaff = async (req, res) => {
    try {
        const { name, email, password, roleId, isDoctor } = req.body;

        if (!name || !email || !password || !roleId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingStaff = await OpdUser.findOne({ email: email.toLowerCase() });
        if (existingStaff) {
            return res.status(409).json({ message: "Staff user with this email already exists" });
        }

        const role = await OpdRole.findById(roleId);
        if (!role) {
            return res.status(404).json({ message: "Assigned role not found" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newStaff = await OpdUser.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: roleId,
            isDoctor: !!isDoctor
        });

        res.status(201).json({
            message: "Staff member created successfully",
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                role: role.name,
                isDoctor: newStaff.isDoctor
            }
        });
    } catch (error) {
        console.error("Create Staff Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getDoctors = async (req, res) => {
    try {
        // A staff member counts as a doctor if either the explicit "Doctor"
        // checkbox is set, or they are assigned a role whose name contains
        // "doctor" (e.g. a role literally called "Doctor").
        const staff = await OpdUser.find({}).select("name email isDoctor role").populate("role", "name");
        const doctors = staff
            .filter((s) => s.isDoctor || s.role?.name?.toLowerCase().includes("doctor"))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json(doctors);
    } catch (error) {
        console.error("Get Doctors Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getStaff = async (req, res) => {
    try {
        const staff = await OpdUser.find({}).populate("role").select("-password");
        res.status(200).json(staff);
    } catch (error) {
        console.error("Get Staff Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await OpdUser.findByIdAndDelete(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }
        res.status(200).json({ message: "Staff member deleted successfully" });
    } catch (error) {
        console.error("Delete Staff Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
