// Test-only preloader inherited by the audit worker; never shipped as a runtime dependency.
/* oxlint-disable typescript/no-require-imports -- Node --require preloading deliberately uses CommonJS. */
const { syncBuiltinESMExports } = require('node:module');
const deny = () => {
  throw new Error('NETWORK_CALL_FORBIDDEN');
};
globalThis.fetch = deny;
globalThis.WebSocket = class {
  constructor() {
    deny();
  }
};
for (const [moduleName, methods] of [
  ['node:http', ['request', 'get']],
  ['node:https', ['request', 'get']],
  ['node:net', ['connect', 'createConnection']],
  ['node:tls', ['connect']],
  ['node:dgram', ['createSocket']],
  ['node:dns', ['lookup', 'resolve']],
  ['node:dns/promises', ['lookup', 'resolve']],
]) {
  const builtin = require(moduleName);
  for (const method of methods) builtin[method] = deny;
}
require('node:net').Socket.prototype.connect = deny;
syncBuiltinESMExports();
