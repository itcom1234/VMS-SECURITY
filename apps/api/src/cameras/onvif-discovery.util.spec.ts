import assert from 'node:assert/strict';
import {
  classifyOnvifError,
  pickSuggestedProfileToken,
  type OnvifProfileSummary,
} from './onvif-discovery.util';

const profiles: OnvifProfileSummary[] = [
  {
    token: 'sub',
    name: 'substream',
    rtspUrl: 'rtsp://cam/sub',
    videoWidth: 640,
  },
  {
    token: 'main',
    name: 'MainStream',
    rtspUrl: 'rtsp://cam/main',
    videoWidth: 1920,
  },
];

assert.equal(pickSuggestedProfileToken(profiles), 'main');

const widthOnly: OnvifProfileSummary[] = [
  { token: 'a', name: 'Profile_2', rtspUrl: 'rtsp://a', videoWidth: 720 },
  { token: 'b', name: 'Profile_1', rtspUrl: 'rtsp://b', videoWidth: 1080 },
];
assert.equal(pickSuggestedProfileToken(widthOnly), 'b');

assert.equal(classifyOnvifError(new Error('HTTP 401 Unauthorized')).code, 'AUTH_FAILED');
assert.equal(classifyOnvifError(new Error('connect ECONNREFUSED')).code, 'UNREACHABLE');

console.log('onvif-discovery.util.spec.ts: OK');