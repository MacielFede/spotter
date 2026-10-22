const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

// Workspace TypeScript sources use Node-style `./foo.js` specifiers. Metro does
// not map those to `foo.ts`, so retry extensionless before failing.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    try {
      return context.resolveRequest(context, moduleName.slice(0, -3), platform);
    } catch {
      // Fall through to the original specifier for real .js files.
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
