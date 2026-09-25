import express from "express";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";
import {
    getMonthlySalaries,
    generateMonthlySalaries,
    updateMonthSalaryAmount,
    addSalaryPayment,
    deleteSalaryPayment,
    updateStaffBaseSalary,
    updateStaffProfile,
    getAccountsSummary
} from "../controllers/opdAccount.controller.js";

const router = express.Router();

// All routes require valid OPD authentication
router.use(verifyOpdUser);

// Salary & Part-by-Part Payroll Routes
router.get("/salaries", requirePermission(["accounts:read", "manage_accounts"]), getMonthlySalaries);
router.post("/salaries/generate", requirePermission(["accounts:add", "manage_accounts"]), generateMonthlySalaries);
router.put("/salaries/:salaryId/amount", requirePermission(["accounts:edit", "manage_accounts"]), updateMonthSalaryAmount);
router.post("/salaries/payment", requirePermission(["accounts:add", "accounts:edit", "manage_accounts"]), addSalaryPayment);
router.delete("/salaries/payment/:paymentId", requirePermission(["accounts:delete", "manage_accounts"]), deleteSalaryPayment);
router.put("/staff/:staffId/base-salary", requirePermission(["accounts:edit", "manage_accounts"]), updateStaffBaseSalary);
router.put("/staff/:staffId/profile", requirePermission(["accounts:edit", "manage_accounts"]), updateStaffProfile);

// Financial Overview Summary
router.get("/summary", requirePermission(["accounts:read", "manage_accounts"]), getAccountsSummary);

export default router;
