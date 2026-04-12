const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Deshabilitar package exports para forzar las versiones CJS de las dependencias.
// Evita que paquetes como @tanstack/react-query usen sus builds ESM
// (que contienen import.meta) cuando se bundlea para web.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
