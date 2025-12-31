// rateLimiter.js
const limits = {};

module.exports = function rateLimiter(key, maxAttempts, blockTimeMs) {
  const now = Date.now();

  if (!limits[key]) {
    limits[key] = {
      attempts: 0,
      blockedUntil: null
    };
  }

  const record = limits[key];

  // If blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return { blocked: true };
  }

  return {
    record,
    block: () => {
      record.blockedUntil = now + blockTimeMs;
      record.attempts = 0;
    }
  };
};
