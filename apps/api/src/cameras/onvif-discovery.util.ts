export type OnvifProfileSummary = {
  token: string;
  name: string;
  rtspUrl: string | null;
  videoWidth?: number;
  fixed?: boolean;
};

/** Prefer a "main" profile name, else widest encoder, else first RTSP-capable profile. */
export function pickSuggestedProfileToken(
  profiles: OnvifProfileSummary[],
): string | undefined {
  if (!profiles.length) return undefined;
  const withRtsp = profiles.filter((p) => p.rtspUrl);
  const pool = withRtsp.length > 0 ? withRtsp : profiles;
  const byName = pool.find((p) =>
    /main|primary|stream\s*1|profile\s*0|ch0|channel\s*0/i.test(p.name),
  );
  if (byName) return byName.token;
  const sorted = [...pool].sort(
    (a, b) => (b.videoWidth ?? 0) - (a.videoWidth ?? 0),
  );
  return sorted[0]?.token;
}

export function profileVideoWidth(profile: {
  videoEncoderConfiguration?: { resolution?: { width?: number } };
}): number | undefined {
  const w = profile.videoEncoderConfiguration?.resolution?.width;
  return typeof w === 'number' ? w : undefined;
}

export type OnvifErrorCode =
  | 'AUTH_FAILED'
  | 'UNREACHABLE'
  | 'NOT_ONVIF'
  | 'NO_PROFILES'
  | 'UNKNOWN';

export function classifyOnvifError(err: unknown): {
  code: OnvifErrorCode;
  message: string;
} {
  const text =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : String(err ?? 'Unknown error');
  const lower = text.toLowerCase();

  if (
    /401|unauthorized|not authorized|invalid credentials|authentication|digest|ws-security/i.test(
      text,
    )
  ) {
    return {
      code: 'AUTH_FAILED',
      message:
        'ONVIF authentication failed — check username and password for this device.',
    };
  }
  if (
    /econnrefused|etimedout|enotfound|ehostunreach|timeout|network|socket|fetch failed/i.test(
      lower,
    )
  ) {
    return {
      code: 'UNREACHABLE',
      message: `Cannot reach camera at the given host/port — ${text}`,
    };
  }
  if (/not onvif|wsdl|soap fault|unknown device|capabilities/i.test(lower)) {
    return {
      code: 'NOT_ONVIF',
      message: `Device did not respond as ONVIF — ${text}`,
    };
  }
  return { code: 'UNKNOWN', message: text };
}