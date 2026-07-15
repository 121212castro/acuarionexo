#!/usr/bin/env bash
set -euo pipefail

APP_DELEGATE="${1:-ios/App/App/AppDelegate.swift}"

test -f "$APP_DELEGATE"

python3 - "$APP_DELEGATE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

register_marker = "capacitorDidRegisterForRemoteNotifications"
fail_marker = "capacitorDidFailToRegisterForRemoteNotifications"

if register_marker in text and fail_marker in text:
    print("Capacitor APNs AppDelegate callbacks already present.")
    raise SystemExit(0)

callbacks = '''

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }
'''

closing = text.rfind("}")
if closing < 0:
    raise SystemExit("AppDelegate.swift has no closing class brace")

text = text[:closing] + callbacks + text[closing:]
path.write_text(text)
PY

grep -q 'capacitorDidRegisterForRemoteNotifications' "$APP_DELEGATE"
grep -q 'capacitorDidFailToRegisterForRemoteNotifications' "$APP_DELEGATE"
printf 'app_delegate=%s\nregistration_callback=present\nregistration_error_callback=present\n' "$APP_DELEGATE" > push-appdelegate-audit.txt
echo "Capacitor APNs callbacks enabled in AppDelegate.swift."