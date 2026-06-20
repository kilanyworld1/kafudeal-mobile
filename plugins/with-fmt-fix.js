const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) return config;
      let podfile = fs.readFileSync(podfilePath, 'utf-8');
      if (podfile.includes('FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0')) return config;
      const fix = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |build_config|
      build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
      build_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FMT_USE_NONTYPE_TEMPLATE_PARAMETERS=0'
    end
  end
`;
      podfile = podfile.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${fix}`
      );
      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
