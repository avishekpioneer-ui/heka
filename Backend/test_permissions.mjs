import { hasPermission } from "./opd/middleware/opdAuth.js";
import { ALL_VALID_PERMISSIONS, CANONICAL_PERMISSIONS } from "./opd/constants/opdPermissions.js";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        testsPassed++;
        console.log(`✅ PASS: ${message}`);
    } else {
        testsFailed++;
        console.error(`❌ FAIL: ${message}`);
    }
}

console.log("=== Testing Granular Permissions System ===");

// 1. Super Admin Wildcard test
assert(hasPermission(["*"], "patients:read"), "Super admin wildcard grants patients:read");
assert(hasPermission(["*"], "billing:delete"), "Super admin wildcard grants billing:delete");

// 2. Exact match
assert(hasPermission(["patients:read"], "patients:read"), "Exact permission patients:read matches");
assert(!hasPermission(["patients:read"], "patients:add"), "User with only patients:read CANNOT patients:add");
assert(!hasPermission(["patients:read"], "patients:delete"), "User with only patients:read CANNOT patients:delete");

// 3. Module wildcard match
assert(hasPermission(["patients:*"], "patients:read"), "Module wildcard patients:* grants patients:read");
assert(hasPermission(["patients:*"], "patients:delete"), "Module wildcard patients:* grants patients:delete");
assert(!hasPermission(["patients:*"], "billing:read"), "patients:* does NOT grant billing:read");

// 4. Legacy permission expansion
assert(hasPermission(["manage_patients"], "patients:read"), "Legacy manage_patients grants patients:read");
assert(hasPermission(["manage_patients"], "patients:add"), "Legacy manage_patients grants patients:add");
assert(hasPermission(["manage_patients"], "patients:edit"), "Legacy manage_patients grants patients:edit");
assert(hasPermission(["manage_patients"], "patients:delete"), "Legacy manage_patients grants patients:delete");
assert(!hasPermission(["manage_patients"], "billing:read"), "Legacy manage_patients does NOT grant billing:read");

// 5. Mixed permissions
const doctorPerms = ["appointments:read", "consultations:read", "consultations:add", "consultations:edit", "tests:read", "medicines:read"];
assert(hasPermission(doctorPerms, "consultations:read"), "Doctor has consultations:read");
assert(hasPermission(doctorPerms, "consultations:add"), "Doctor has consultations:add");
assert(!hasPermission(doctorPerms, "consultations:delete"), "Doctor does NOT have consultations:delete");
assert(!hasPermission(doctorPerms, "billing:delete"), "Doctor does NOT have billing:delete");
assert(!hasPermission(doctorPerms, "roles:add"), "Doctor does NOT have roles:add");

// 6. Base access
assert(hasPermission(["access_opd"], "access_opd"), "Base access_opd matches");

console.log(`\nResults: ${testsPassed} passed, ${testsFailed} failed.`);
if (testsFailed > 0) process.exit(1);
