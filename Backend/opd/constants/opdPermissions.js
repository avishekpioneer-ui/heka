export const OPD_ACTIONS = ["read", "add", "edit", "delete"];

export const OPD_MODULES = [
    {
        id: "patients",
        name: "Patients Registry",
        description: "Patient registration, profiles, contact info & history",
        icon: "🧑‍🤝‍🧑"
    },
    {
        id: "appointments",
        name: "Appointments Queue",
        description: "Schedule, view, update and manage patient appointments",
        icon: "📅"
    },
    {
        id: "consultations",
        name: "Clinical Consultations",
        description: "Doctor workspaces, diagnoses, prescriptions and notes",
        icon: "💬"
    },
    {
        id: "medicines",
        name: "Pharmacy Inventory",
        description: "Medicine stock levels, pricing, catalog and restocking",
        icon: "💊"
    },
    {
        id: "tests",
        name: "Diagnostics & Lab",
        description: "Diagnostic test catalog, price list and lab orders",
        icon: "🧪"
    },
    {
        id: "billing",
        name: "Billing & Invoices",
        description: "Generate bills, record payments, invoices and discounts",
        icon: "🧾"
    },
    {
        id: "roles",
        name: "Staff & Access Roles",
        description: "Configure custom roles, permissions matrix and staff roster",
        icon: "🛡️"
    },
    {
        id: "reminders",
        name: "Follow-up Reminders",
        description: "Patient notifications, call reminders and auto-scheduling",
        icon: "🔔"
    },
    {
        id: "accounts",
        name: "Accounts & Payroll",
        description: "Staff salaries, installments, clinic expenses and financial ledger",
        icon: "💳"
    },
    {
        id: "reports",
        name: "Revenue & Reports",
        description: "Financial summary, revenue analytics, outstanding dues and collection reports",
        icon: "📊"
    }
];

// Generates all canonical permissions: e.g. "patients:read", "patients:add", etc.
export const CANONICAL_PERMISSIONS = OPD_MODULES.flatMap((mod) =>
    OPD_ACTIONS.map((action) => `${mod.id}:${action}`)
);

// Portal base access
export const BASE_PERMISSIONS = ["access_opd"];

// Legacy permission mapping to maintain full backward compatibility
export const LEGACY_PERMISSION_MAP = {
    access_opd: ["access_opd"],
    manage_patients: ["patients:read", "patients:add", "patients:edit", "patients:delete"],
    manage_appointments: ["appointments:read", "appointments:add", "appointments:edit", "appointments:delete"],
    manage_consultations: ["consultations:read", "consultations:add", "consultations:edit", "consultations:delete"],
    manage_medicines: ["medicines:read", "medicines:add", "medicines:edit", "medicines:delete"],
    manage_tests: ["tests:read", "tests:add", "tests:edit", "tests:delete"],
    manage_billing: ["billing:read", "billing:add", "billing:edit", "billing:delete"],
    manage_roles: ["roles:read", "roles:add", "roles:edit", "roles:delete"],
    manage_accounts: ["accounts:read", "accounts:add", "accounts:edit", "accounts:delete"],
    manage_reports: ["reports:read", "reports:add", "reports:edit", "reports:delete"]
};

// All valid permissions accepted when creating/updating roles
export const ALL_VALID_PERMISSIONS = [
    "*",
    ...BASE_PERMISSIONS,
    ...CANONICAL_PERMISSIONS,
    ...Object.keys(LEGACY_PERMISSION_MAP)
];
