/**
 * Role Service
 * Centralized service for all role management operations
 * Enforces permission rules and manages role transitions
 */

import { User, UserRole, RoleAuditLog } from '../types';
import {
    addOwnerRole as dbAddOwnerRole,
    removeOwnerRole as dbRemoveOwnerRole,
    switchActiveRole as dbSwitchActiveRole,
    createRoleAuditLog,
    getUserById,
    updateUser,
} from './database';

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user can add listings
 * Requires: activeRole === 'owner' AND ownerKycStatus === 'verified'
 */
export const canAddListing = (user: User): boolean => {
    return user.activeRole === 'owner' && user.ownerKycStatus === 'verified';
};

/**
 * Check if user can rent products
 * Requires: activeRole === 'customer' AND customerKycStatus === 'verified'
 */
export const canRentProduct = (user: User): boolean => {
    return user.activeRole === 'customer' && user.customerKycStatus === 'verified';
};

/**
 * Get all permissions for a user based on their active role
 */
export const getUserPermissions = (user: User): {
    canList: boolean;
    canRent: boolean;
    needsCustomerKyc: boolean;
    needsOwnerKyc: boolean;
} => {
    return {
        canList: canAddListing(user),
        canRent: canRentProduct(user),
        needsCustomerKyc: user.activeRole === 'customer' && user.customerKycStatus !== 'verified',
        needsOwnerKyc: user.activeRole === 'owner' && user.ownerKycStatus !== 'verified',
    };
};

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * User-initiated: Become an owner
 * Adds 'owner' role to user's roles array and switches activeRole to 'owner'
 */
export const becomeOwner = async (user: User): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] User becoming owner:', user.id);

    // Add owner role
    const updatedUser = dbAddOwnerRole(user.id, 'self');

    // Switch to owner role
    const finalUser = dbSwitchActiveRole(updatedUser.id, 'owner');

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'owner_role_added',
        performedBy: user.id,
        performedByName: user.name,
        timestamp: new Date(),
        details: 'User self-registered as owner',
        previousState: { roles: ['customer'], activeRole: 'customer' },
        newState: { roles: finalUser.roles, activeRole: finalUser.activeRole },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] User is now an owner:', finalUser.id);
    return finalUser;
};

/**
 * Admin-initiated: Add owner role to user
 */
export const adminAddOwnerRole = async (
    userId: string,
    adminId: string,
    adminName: string
): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] Admin adding owner role:', userId, 'Admin:', adminId);

    const user = getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const previousState = { roles: [...user.roles], activeRole: user.activeRole };

    // Add owner role
    const updatedUser = dbAddOwnerRole(userId, 'admin', adminId);

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'owner_role_added',
        performedBy: adminId,
        performedByName: adminName,
        timestamp: new Date(),
        details: `Admin ${adminName} added owner role to user`,
        previousState,
        newState: { roles: updatedUser.roles, activeRole: updatedUser.activeRole },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] Owner role added by admin:', userId);
    return updatedUser;
};

/**
 * Admin-initiated: Remove owner role from user
 * Only allowed if user has no active listings
 */
export const adminRemoveOwnerRole = async (
    userId: string,
    adminId: string,
    adminName: string
): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] Admin removing owner role:', userId, 'Admin:', adminId);

    const user = getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const previousState = { roles: [...user.roles], activeRole: user.activeRole };

    // Remove owner role (this will throw if user has active listings)
    const updatedUser = dbRemoveOwnerRole(userId, 'admin', adminId);

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'owner_role_removed',
        performedBy: adminId,
        performedByName: adminName,
        timestamp: new Date(),
        details: `Admin ${adminName} removed owner role from user`,
        previousState,
        newState: { roles: updatedUser.roles, activeRole: updatedUser.activeRole },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] Owner role removed by admin:', userId);
    return updatedUser;
};

/**
 * Switch user's active role
 * User must have both roles to switch
 */
export const switchRole = async (user: User, newRole: UserRole): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] Switching role:', user.id, 'to', newRole);

    const previousRole = user.activeRole;

    // Switch active role
    const updatedUser = dbSwitchActiveRole(user.id, newRole);

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'role_switched',
        performedBy: user.id,
        performedByName: user.name,
        timestamp: new Date(),
        details: `Switched from ${previousRole} to ${newRole}`,
        previousState: { activeRole: previousRole },
        newState: { activeRole: newRole },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] Role switched:', previousRole, '->', newRole);
    return updatedUser;
};

/**
 * Admin: Reset customer KYC status
 */
export const adminResetCustomerKyc = async (
    userId: string,
    adminId: string,
    adminName: string
): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] Admin resetting customer KYC:', userId);

    const user = getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const previousStatus = user.customerKycStatus;

    // Reset customer KYC
    const updatedUser = updateUser(userId, {
        customerKycStatus: 'not_submitted',
        customerKycData: undefined,
    });

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'customer_kyc_reset',
        performedBy: adminId,
        performedByName: adminName,
        timestamp: new Date(),
        details: `Admin ${adminName} reset customer KYC status`,
        previousState: { customerKycStatus: previousStatus },
        newState: { customerKycStatus: 'not_submitted' },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] Customer KYC reset by admin:', userId);
    return updatedUser;
};

/**
 * Admin: Reset owner KYC status
 */
export const adminResetOwnerKyc = async (
    userId: string,
    adminId: string,
    adminName: string
): Promise<User> => {
    console.log('🎯 [ROLE SERVICE] Admin resetting owner KYC:', userId);

    const user = getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const previousStatus = user.ownerKycStatus;

    // Reset owner KYC
    const updatedUser = updateUser(userId, {
        ownerKycStatus: 'not_submitted',
        ownerKycData: undefined,
    });

    // Create audit log
    const auditLog: RoleAuditLog = {
        id: `AUDIT_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        userName: user.name,
        action: 'owner_kyc_reset',
        performedBy: adminId,
        performedByName: adminName,
        timestamp: new Date(),
        details: `Admin ${adminName} reset owner KYC status`,
        previousState: { ownerKycStatus: previousStatus },
        newState: { ownerKycStatus: 'not_submitted' },
    };
    createRoleAuditLog(auditLog);

    console.log('✅ [ROLE SERVICE] Owner KYC reset by admin:', userId);
    return updatedUser;
};
