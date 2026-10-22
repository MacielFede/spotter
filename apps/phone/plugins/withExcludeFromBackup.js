const { withAppDelegate } = require('@expo/config-plugins');

const MARKER = '// ADR 0047: exclude app data from iCloud backup.';

/** Inject the exclusion into the generated AppDelegate (CNG-safe, idempotent). */
const injectExcludeFromBackup = (contents) => {
  if (contents.includes(MARKER)) return contents;
  const snippet = `    ${MARKER}
    if let appData = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
      var appData = appData
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try? appData.setResourceValues(values)
    }
`;
  return contents.replace(/(didFinishLaunchingWithOptions[\s\S]*?\{\n)/, `$1${snippet}`);
};

module.exports = function withExcludeFromBackup(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      config.modResults.contents = injectExcludeFromBackup(config.modResults.contents);
    }
    return config;
  });
};

module.exports.injectExcludeFromBackup = injectExcludeFromBackup;
module.exports.MARKER = MARKER;
