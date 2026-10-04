import { useState, useEffect, useCallback } from 'react';
import storage from './storage';

export const LEGACY_PERMISSION_MAP = {
  access_opd: ['access_opd'],
  manage_patients: ['patients:read', 'patients:add', 'patients:edit', 'patients:delete'],
  manage_appointments: ['appointments:read', 'appointments:add', 'appointments:edit', 'appointments:delete'],
  manage_consultations: ['consultations:read', 'consultations:add', 'consultations:edit', 'consultations:delete'],
  manage_medicines: ['medicines:read', 'medicines:add', 'medicines:edit', 'medicines:delete'],
  manage_tests: ['tests:read', 'tests:add', 'tests:edit', 'tests:delete'],
  manage_billing: ['billing:read', 'billing:add', 'billing:edit', 'billing:delete'],
  manage_roles: ['roles:read', 'roles:add', 'roles:edit', 'roles:delete'],
  manage_accounts: ['accounts:read', 'accounts:add', 'accounts:edit', 'accounts:delete'],
  manage_reports: ['reports:read', 'reports:add', 'reports:edit', 'reports:delete'],
};

/**
 * Check if the given user permissions array satisfies the required permission(s).
 *
 * @param {string[]} userPermissions - Array of permission strings held by the user.
 * @param {string|string[]} requiredPermission - A single permission string or array of acceptable permissions.
 * @returns {boolean} True if the user has permission, false otherwise.
 */
export const hasPermission = (userPermissions = [], requiredPermission) => {
  if (!requiredPermission) return true;
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true; // Super admin wildcard

  // If requiredPermission is an array of acceptable permissions, true if ANY match
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some((perm) => hasPermission(userPermissions, perm));
  }

  // Exact match
  if (userPermissions.includes(requiredPermission)) return true;

  // Build effective permissions with legacy expansion
  const effectivePermissions = new Set();
  for (const p of userPermissions) {
    effectivePermissions.add(p);
    if (LEGACY_PERMISSION_MAP[p]) {
      LEGACY_PERMISSION_MAP[p].forEach((mapped) => effectivePermissions.add(mapped));
    }
  }

  if (effectivePermissions.has(requiredPermission)) return true;

  // Module wildcard check: e.g. "patients:*" matches "patients:read"
  if (requiredPermission.includes(':')) {
    const [resource] = requiredPermission.split(':');
    if (effectivePermissions.has(`${resource}:*`)) return true;
  }

  // Legacy key check
  if (LEGACY_PERMISSION_MAP[requiredPermission]) {
    return LEGACY_PERMISSION_MAP[requiredPermission].some((p) => effectivePermissions.has(p));
  }

  return false;
};

/**
 * React hook to get and check permissions from storage or passed-in permissions.
 *
 * @param {string[]} [propPermissions] - Optional permissions passed as prop.
 * @param {function} [propHasPermission] - Optional hasPermission function passed as prop.
 */
export function usePermissions(propPermissions, propHasPermission) {
  const [permissions, setPermissions] = useState(
    Array.isArray(propPermissions) ? propPermissions : []
  );

  useEffect(() => {
    if (Array.isArray(propPermissions)) {
      setPermissions(propPermissions);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const permStr = await storage.getItem('userPermissions');
        const userCat = await storage.getItem('userCategory');
        if (!isMounted) return;

        if (permStr) {
          const parsed = JSON.parse(permStr);
          setPermissions(Array.isArray(parsed) ? parsed : []);
        } else if (userCat === 'admin') {
          setPermissions(['*']);
        } else {
          setPermissions([]);
        }
      } catch (e) {
        if (isMounted) setPermissions([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [propPermissions]);

  const check = useCallback(
    (required) => {
      if (typeof propHasPermission === 'function') {
        return propHasPermission(required);
      }
      return hasPermission(permissions, required);
    },
    [propHasPermission, permissions]
  );

  return { permissions, hasPermission: check };
}
