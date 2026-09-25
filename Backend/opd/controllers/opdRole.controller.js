import OpdRole from "../models/OpdRole.js";
import OpdUser from "../models/OpdUser.js";
import OpdSalary from "../models/OpdSalary.js";
import { cascadeForwardCarryOver } from "./opdAccount.controller.js";
import bcrypt from "bcryptjs";
import {
    ALL_VALID_PERMISSIONS,
    OPD_MODULES,
    OPD_ACTIONS,
    CANONICAL_PERMISSIONS
} from "../constants/opdPermissions.js";

export const VALID_PERMISSIONS = ALL_VALID_PERMISSIONS;

export const getPermissions = async (req, res) => {
    try {
        res.status(200).json({
            modules: OPD_MODULES,
            actions: OPD_ACTIONS,
            canonical: CANONICAL_PERMISSIONS,
            validPermissions: ALL_VALID_PERMISSIONS
        });
    } catch (error) {
        console.error("Get Permissions Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


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

        if (role.name === "Doctor" && name && name !== "Doctor") {
            return res.status(400).json({ message: "Pre-defined role 'Doctor' name cannot be changed" });
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
        const role = await OpdRole.findById(id);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }
        if (role.name === "Doctor") {
            return res.status(400).json({ message: "Pre-defined role 'Doctor' cannot be deleted" });
        }
        await OpdRole.findByIdAndDelete(id);
        res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Delete Role Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Staff Management
export const createStaff = async (req, res) => {
    try {
        const { name, email, password, roleId, isDoctor, fees, baseSalary, doj, updatePermanentBase = true } = req.body;

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

        const effectiveBase = updatePermanentBase ? (baseSalary ? parseFloat(baseSalary) : 0) : 0;

        const newStaff = await OpdUser.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: roleId,
            isDoctor: !!isDoctor,
            fees: fees ? parseFloat(fees) : 0,
            baseSalary: effectiveBase,
            doj: doj ? new Date(doj) : new Date()
        });

        // If not updating permanent base salary but a salary was entered, generate the initial month with that custom salary
        if (!updatePermanentBase && baseSalary && parseFloat(baseSalary) > 0) {
            const initialMonth = (doj ? new Date(doj) : new Date()).toISOString().slice(0, 7);
            const parsedAmount = parseFloat(baseSalary);
            await OpdSalary.create({
                staffId: newStaff._id,
                month: initialMonth,
                baseSalary: parsedAmount,
                isCustomSalary: true,
                carriedOverBalance: 0,
                netPayable: parsedAmount,
                payments: [],
                totalPaid: 0,
                remainingBalance: parsedAmount,
                status: "Unpaid"
            });
        }

        res.status(201).json({
            message: "Staff member created successfully",
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                role: role.name,
                isDoctor: newStaff.isDoctor,
                fees: newStaff.fees,
                baseSalary: newStaff.baseSalary,
                doj: newStaff.doj
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
        const staff = await OpdUser.find({}).select("name email isDoctor role fees").populate("role", "name");
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

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, roleId, isDoctor, fees, baseSalary, doj, updatePermanentBase = true } = req.body;

        const staff = await OpdUser.findById(id);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        if (email && email.toLowerCase() !== staff.email.toLowerCase()) {
            const existing = await OpdUser.findOne({ email: email.toLowerCase() });
            if (existing && existing._id.toString() !== id) {
                return res.status(409).json({ message: "Another staff user already uses this email" });
            }
            staff.email = email.toLowerCase();
        }

        if (name) staff.name = name;

        if (roleId) {
            const role = await OpdRole.findById(roleId);
            if (!role) {
                return res.status(404).json({ message: "Assigned role not found" });
            }
            staff.role = roleId;
            if (isDoctor !== undefined) {
                staff.isDoctor = !!isDoctor;
            } else if (role.name?.toLowerCase().includes("doctor")) {
                staff.isDoctor = true;
            }
        } else if (isDoctor !== undefined) {
            staff.isDoctor = !!isDoctor;
        }

        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            staff.password = await bcrypt.hash(password.trim(), salt);
        }

        if (fees !== undefined && fees !== null && fees !== "") {
            staff.fees = parseFloat(fees);
        }

        if (doj) {
            staff.doj = new Date(doj);
        }

        if (baseSalary !== undefined && baseSalary !== null && baseSalary !== "") {
            const parsedSalary = parseFloat(baseSalary);
            const currentMonth = new Date().toISOString().slice(0, 7);

            if (updatePermanentBase) {
                // Update staff profile base salary for future months
                staff.baseSalary = parsedSalary;
                // Also sync current month's record if not custom-edited
                const currSalary = await OpdSalary.findOne({ staffId: id, month: currentMonth });
                if (currSalary && !currSalary.isCustomSalary) {
                    currSalary.baseSalary = parsedSalary;
                    currSalary.netPayable = parsedSalary + (currSalary.carriedOverBalance || 0);
                    currSalary.remainingBalance = currSalary.netPayable - (currSalary.totalPaid || 0);
                    await currSalary.save();
                    await cascadeForwardCarryOver(id, currentMonth);
                }
            } else {
                // Only update the current active month as custom (one-time), do not change staff.baseSalary for future months!
                let currSalary = await OpdSalary.findOne({ staffId: id, month: currentMonth });
                if (currSalary) {
                    currSalary.baseSalary = parsedSalary;
                    currSalary.isCustomSalary = true;
                    currSalary.netPayable = parsedSalary + (currSalary.carriedOverBalance || 0);
                    currSalary.remainingBalance = currSalary.netPayable - (currSalary.totalPaid || 0);
                    await currSalary.save();
                    await cascadeForwardCarryOver(id, currentMonth);
                }
            }
        }

        await staff.save();

        const updatedStaff = await OpdUser.findById(id).populate("role").select("-password");

        res.status(200).json({
            message: "Staff member updated successfully",
            staff: updatedStaff
        });
    } catch (error) {
        console.error("Update Staff Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

