import { describe, expect, it } from 'vitest';
import plugin from './withExcludeFromBackup';

const { injectExcludeFromBackup, MARKER } = plugin as unknown as {
  injectExcludeFromBackup: (contents: string) => string;
  MARKER: string;
};

const delegate = `import Expo

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe('iOS backup exclusion plugin (issue #76)', () => {
  it('adds NSURLIsExcludedFromBackupKey handling to didFinishLaunching', () => {
    const patched = injectExcludeFromBackup(delegate);
    expect(patched).toContain(MARKER);
    expect(patched).toContain('isExcludedFromBackup = true');
    expect(patched.indexOf(MARKER)).toBeLessThan(patched.indexOf('return super.application'));
  });

  it('is idempotent', () => {
    const once = injectExcludeFromBackup(delegate);
    expect(injectExcludeFromBackup(once)).toBe(once);
  });
});
