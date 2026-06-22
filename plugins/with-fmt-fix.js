/**
 * Expo config plugin to fix iOS build error:
 *   "fmt::basic_format_string is not a constant expression"
 *
 * Root cause: Xcode 26.4 ships a stricter Clang that tightened C++20
 * `consteval` validation. The {fmt} library version bundled inside
 * React Native uses a compile-time format string pattern that no longer
 * satisfies the stricter constant-expression rules. The compiler is
 * technically correct, but the practical result is that the build fails
 * with no code changes on our side.
 *
 * THE CORRECT FIX (per bleepingswift.com and tracked in:
 *   - https://github.com/facebook/react-native/issues/55601
 *   - https://github.com/expo/expo/issues/44229):
 *
 * Compile ONLY the `fmt` pod against the C++17 standard. Since `consteval`
 * didn't exist before C++20, the problematic code path is simply skipped
 * and fmt falls back to its runtime format string validation. The rest of
 * the project keeps using C++20, which matters because React Native's own
 * code genuinely needs it.
 *
 * Previous (wrong) attempt downgraded all pods or used the wrong setting.
 * The narrow `target.name == 'fmt'` scope is the key.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIX_MARKER = '# v0.16.1 fmt consteval fix';

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

      const fix = `
    ${FIX_MARKER}
    # Force the fmt pod to compile against C++17 instead of C++20 so the
    # consteval-based FMT_COMPILE_STRING path is excluded (no consteval in
    # C++17). Targets fmt ONLY — every other pod keeps C++20. See the issue
    # tracker links in plugins/with-fmt-fix.js for upstream progress.
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |build_config|
          build_config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

      // Insert the fix into the existing post_install do |installer| block.
      // Expo's generated Podfile has exactly one such block.
      if (!podfile.includes('post_install do |installer|')) {
        console.warn('[with-fmt-fix] No post_install block found, skipping');
        return config;
      }

      podfile = podfile.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${fix}`
      );

      fs.writeFileSync(podfilePath, podfile);
      console.log('[with-fmt-fix] Patched Podfile to force fmt to C++17');
      return config;
    },
  ]);
};
