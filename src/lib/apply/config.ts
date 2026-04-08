function readBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (/^(1|true|yes|on)$/i.test(value)) return true;
  if (/^(0|false|no|off)$/i.test(value)) return false;
  return fallback;
}

export function isApplyV3Enabled() {
  return readBooleanEnv("APPLY_V3_ENABLED", false);
}

export function isApplyPreflightEnabled() {
  return readBooleanEnv("APPLY_PREFLIGHT_ENABLED", isApplyV3Enabled());
}

export function isApplyAgentFallbackEnabled() {
  return readBooleanEnv("APPLY_AGENT_FALLBACK_ENABLED", true);
}

export function isApplyNetworkShortcutEnabled() {
  return readBooleanEnv("APPLY_NETWORK_SHORTCUT_ENABLED", false);
}
