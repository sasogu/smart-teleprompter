export const SPEECH_ERROR_KEYS = {
  "no-speech": "micStillListening",
  "audio-capture": "micNoInput",
  network: "micServiceUnavailable",
  "not-allowed": "micPermissionBlocked",
  "service-not-allowed": "micServiceBlocked",
  aborted: "micStopped",
};

export const FATAL_SPEECH_ERRORS = new Set([
  "audio-capture",
  "network",
  "not-allowed",
  "service-not-allowed",
]);
