import { hasApplyAdapter } from "./adapters";
import { isApplyAgentFallbackEnabled, isApplyV3Enabled } from "./config";
import type {
  ApplyExecutionPlan,
  ApplyExecutionStrategy,
  ApplyManifestStatus,
  ApplyPlatform,
  ApplyReadiness,
} from "./types";

export function selectApplyExecutionStrategy(input: {
  v3Enabled?: boolean;
  platform: ApplyPlatform;
  readiness?: ApplyReadiness | null;
  manifestStatus?: ApplyManifestStatus | null;
  plan?: ApplyExecutionPlan | null;
}) {
  if (!input.v3Enabled && input.v3Enabled !== undefined) {
    return "legacy_generic" as const;
  }

  const enabled = input.v3Enabled ?? isApplyV3Enabled();
  if (!enabled) {
    return "legacy_generic" as const;
  }

  if (input.readiness === "manual_only" || input.readiness === "blocked") {
    return "manual" as const;
  }

  if (hasApplyAdapter(input.platform) && input.readiness === "ready") {
    return "ats_adapter" as const;
  }

  if (
    input.plan
    && (input.manifestStatus === "validated" || input.manifestStatus === "degraded")
    && input.readiness === "ready"
  ) {
    return "manifest" as const;
  }

  if (isApplyAgentFallbackEnabled()) {
    return "agent_fallback" as const;
  }

  return "manual" as const;
}

export function isDeterministicStrategy(strategy: ApplyExecutionStrategy) {
  return strategy === "ats_adapter" || strategy === "manifest";
}
