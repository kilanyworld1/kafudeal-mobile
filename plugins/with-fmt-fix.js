/**
 * Expo config plugin to fix iOS build error:
 *   "fmt::basic_format_string is not a constant expression"
 *
 * v0.16.2 — Stronger fix after v0.16.1 (which scoped to fmt pod only) failed.
 *
 * Why v0.16.1 didn't work:
 *   The fmt headers are #included by OTHER pods (React core, Hermes,
 *   RCT-Folly, glog). Those consumer pods compile with C++20 and hit the
 *   `consteval` in fmt's headers. Changing fmt's OWN compilation to C++17
 *   doesn't affect what the consumers see.
 *
 * The correct fix:
 *   Define FMT_USE_CONSTEVAL=0 as a global preprocessor macro for ALL pods.
 *   When fmt's headers see this macro defined to 0, they fall back to the
 *   pre-C++20 codepath that uses constexpr (or runtime) format string
 *   validation instead of consteval. This bypasses Xcode 26.4's stricter
 *   consteval enforcement entirely.
 *
 * Also include FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0 as a belt-and-braces
 * fallback for another consteval path inside fmt.
 *
 * AND keep CLANG_CXX_LANGUAGE_STANDARD = 'c++17' for the fmt pod itself,
 * because internally fmt uses consteval in its own .cc files too.
 *
 * Tracked upstream:
 *   - https://github.com/facebook/react-native/issues/55601
 *   - https://github.com/expo/expo/issues/44229
 *   - https://github.com/fmtlib/fmt/issues/4740
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIX_MARKER = '# v0.16.2 fmt consteval fix (global FMT_USE_CONSTEVAL=0)';

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      if (!fs.existsSync(podfilePath)) {
        console.warn('[with-fmt-fix] Podfile not found at', podfilePath);
        return config;
      }

      let podfile = fs.readFileSync(podfilePath, 'utf-8');

      // Idempotent: skip if already patched.
      if (podfile.includes(FIX_MARKER)) {
        console.log('[with-fmt-fix] Already patched, skipping');
        return config;
      }

      // Strip any previous (v0.16.1) marker so we don't leave dead code.
      podfile = podfile.replace(
        /\n\s*# v0\.16\.1 fmt consteval fix[\s\S]*?end\s*\n\s*end\s*\n/m,
        '\n'
      );

      const fix = `
    ${FIX_MARKER}
    # 1) Set FMT_USE_CONSTEVAL=0 and FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0
    #    GLOBALLY so every pod that #includes <fmt/...> sees the macros and
    #    skips the consteval code paths that Xcode 26.4 Clang refuses to
    #    accept. Belt-and-braces — both flags address different fmt internals.
    # 2) Additionally force the fmt pod itself to C++17 because its own .cc
    #    files use consteval that the global macro can't reach (already
    #    expanded by the time the .cc compiles).
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        existing = build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
        existing = ['$(inherited)'] if existing.nil?
        existing = [existing] if existing.is_a?(String)
        existing << 'FMT_USE_CONSTEVAL=0' unless existing.include?('FMT_USE_CONSTEVAL=0')
        existing << 'FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0' unless existing.include?('FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0')
        build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = existing
      end
      if target.name == 'fmt'
        target.build_configurations.each do |build_config|
          build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

      if (!podfile.includes('post_install do |installer|')) {
        console.warn('[with-fmt-fix] No post_install block found, skipping');
        return config;
      }

      podfile = podfile.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${fix}`
      );

      fs.writeFileSync(podfilePath, podfile);
      console.log(
        '[with-fmt-fix] Patched Podfile with global FMT_USE_CONSTEVAL=0 + fmt pod → C++17'
      );
      return config;
    },
  ]);
};
