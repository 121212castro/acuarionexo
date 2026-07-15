#!/usr/bin/env bash
set -euo pipefail

BASE="scripts/ci/testflight-publish.sh"
PATCHED="$RUNNER_TEMP/testflight-publish-push.sh"

python3 - "$BASE" "$PATCHED" <<'PY'
from pathlib import Path
import sys
src = Path(sys.argv[1]).read_text()
sync = "npx cap sync ios 2>&1 | tee -a testflight-build.log\n"
if sync not in src:
    raise SystemExit("cap sync marker not found")
src = src.replace(sync, sync + "bash scripts/ci/enable-ios-push-entitlement.sh\n", 1)
marker = "shasum -a 256 AcuarioNexo-TestFlight.ipa | tee AcuarioNexo-TestFlight.ipa.sha256\n"
check = '''codesign -d --entitlements :- "$APP_PATH" > "$RUNNER_TEMP/signed-app-entitlements.plist" 2> ipa-signed-entitlements.txt
SIGNED_APS=$(/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$RUNNER_TEMP/signed-app-entitlements.plist")
EMBEDDED_APS=$(/usr/libexec/PlistBuddy -c 'Print Entitlements:aps-environment' "$RUNNER_TEMP/embedded-profile.plist")
test "$SIGNED_APS" = production
test "$EMBEDDED_APS" = production
printf 'embedded_aps_environment=%s\nsigned_app_aps_environment=%s\n' "$EMBEDDED_APS" "$SIGNED_APS" >> push-entitlement-audit.txt
'''
if marker not in src:
    raise SystemExit("IPA validation marker not found")
src = src.replace(marker, check + marker, 1)
Path(sys.argv[2]).write_text(src)
PY

chmod +x "$PATCHED"
bash "$PATCHED"
