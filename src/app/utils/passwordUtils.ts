import bcrypt from 'bcryptjs';

/**
 * Password Utilities
 * Handles password hashing, verification, and validation
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        console.log('✅ [PASSWORD] Password hashed successfully');
        return hash;
    } catch (error) {
        console.error('❌ [PASSWORD] Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    try {
        const isValid = await bcrypt.compare(password, hash);
        console.log(`${isValid ? '✅' : '❌'} [PASSWORD] Password verification: ${isValid}`);
        return isValid;
    } catch (error) {
        console.error('❌ [PASSWORD] Error verifying password:', error);
        return false;
    }
};

/**
 * Password strength validation result
 */
export interface PasswordStrengthResult {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    errors: string[];
    score: number; // 0-100
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    } else {
        score += 25;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else {
        score += 25;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else {
        score += 25;
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else {
        score += 25;
    }

    // Bonus points for special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score += 10;
    }

    // Bonus points for length
    if (password.length >= 12) {
        score += 10;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 60) {
        strength = 'weak';
    } else if (score < 90) {
        strength = 'medium';
    } else {
        strength = 'strong';
    }

    return {
        isValid: errors.length === 0,
        strength,
        errors,
        score: Math.min(score, 100),
    };
};

/**
 * Check if two passwords match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
};
