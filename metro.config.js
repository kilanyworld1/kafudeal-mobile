// Metro config — Expo SDK 52
//
// We explicitly add font extensions (.ttf, .otf) to assetExts. They SHOULD
// be in the default, but making it explicit fixes mysterious cases where
// @expo/vector-icons fonts silently don't get bundled into the build.

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Belt-and-suspenders: explicitly ensure font extensions are treated as assets.
const fontExts = ["ttf", "otf"];
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), ...fontExts])
);

module.exports = config;
