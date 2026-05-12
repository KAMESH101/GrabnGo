/**
 * Rate Limiter for KYC Verification
 * 
 * Tracks KYC attempt counts per userId in memory.
 * Max 3 attempts per userId per 24 hours.
 * After 3 failures → block and instruct user to contact admin.
 */

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map<userId, { count: number, windowStart: number, blocked: boolean }>
const attemptStore = new Map();

/**
 * Check if userId is allowed to attempt KYC.
 * @returns { allowed: boolean, attemptsLeft: number }
 */
const checkLimit = (userId) => {
    const now = Date.now();
    const record = attemptStore.get(userId);

    if (!record || (now - record.windowStart > WINDOW_MS)) {
        // Fresh window
        attemptStore.set(userId, { count: 0, windowStart: now, blocked: false });
        return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
    }

    if (record.blocked || record.count >= MAX_ATTEMPTS) {
        console.warn(`[RATE-LIMIT] ⛔ User ${userId} is blocked — ${record.count} attempts used`);
        return { allowed: false, attemptsLeft: 0 };
    }

    return { allowed: true, attemptsLeft: MAX_ATTEMPTS - record.count };
};

/**
 * Record a KYC attempt for userId.
 * Call AFTER the verification attempt (success or failure).
 * @param {string} userId
 * @param {boolean} success - if true, reset count (verified — no further attempts needed)
 */
const recordAttempt = (userId, success) => {
    const now = Date.now();
    const record = attemptStore.get(userId) || { count: 0, windowStart: now, blocked: false };

    if (success) {
        // Successful verification — clear record
        attemptStore.delete(userId);
        console.log(`[RATE-LIMIT] ✅ User ${userId} KYC succeeded — attempt count reset`);
        return;
    }

    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
        record.blocked = true;
        console.warn(`[RATE-LIMIT] 🚫 User ${userId} blocked after ${record.count} failed KYC attempts`);
    } else {
        console.log(`[RATE-LIMIT] ⚠️ User ${userId} failed attempt ${record.count}/${MAX_ATTEMPTS}`);
    }
    attemptStore.set(userId, record);
};

/**
 * Admin override: manually clear a userId's rate-limit block.
 */
const clearBlock = (userId) => {
    attemptStore.delete(userId);
    console.log(`[RATE-LIMIT] 🔓 Admin cleared block for user ${userId}`);
};

module.exports = { checkLimit, recordAttempt, clearBlock };
