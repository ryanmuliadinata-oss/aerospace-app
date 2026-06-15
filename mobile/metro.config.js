const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// use-latest-callback ships an esm.mjs that imports from CJS via a bare import
// statement. Metro's ESM→CJS interop resolves the default export as undefined,
// crashing @react-navigation/core at startup. Force the CJS build directly.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'use-latest-callback') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/use-latest-callback/lib/src/index.js'
      ),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
