/**
 * Simple rule-based ensemble to calculate trust score based on rPPG, Blink Rate, and Lip Sync.
 */
function calculateTrustScore(features) {
  const {
    blinkRate = 0, // Blinks per minute (or an instantaneous metric)
    lipSyncConfidence = 0, // 0 to 1
    rppgStrength = 0, // 0 to 1
  } = features;

  let score = 100;
  let flags = [];

  // Rules
  // 1. Unnatural blink rate (normal is 15-20 / min, but in short bursts we check instantaneous frequency)
  // Let's assume frontend sends a normalized blink validity score (0-1)
  if (features.blinkValidity !== undefined && features.blinkValidity < 0.3) {
    score -= 30;
    flags.push("Low blink validity");
  }

  // 2. Lip-sync mismatch
  if (lipSyncConfidence < 0.5) {
    score -= 40;
    flags.push("Poor lip-sync match");
  }

  // 3. rPPG missing or weak (static image or replay attack)
  if (rppgStrength < 0.2) {
    score -= 30;
    flags.push("Weak rPPG signal (pulse)");
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    trustScore: score,
    flags,
    timestamp: Date.now()
  };
}

module.exports = { calculateTrustScore };
