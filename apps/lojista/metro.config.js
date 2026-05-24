const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Força Metro a resolver pacotes pela entrada CommonJS (main) em vez
// das exports/ESM, evitando erros de "import.meta" no bundle web
// (zustand v5 expõe ESM com import.meta no middleware).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;