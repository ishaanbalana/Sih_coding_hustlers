global.window = global;
global.document = {
  getElementById: (id) => null
};
global.navigator = {};
global.QRCode = { toCanvas: () => {} };

import('./test_craftora_flow.js');
