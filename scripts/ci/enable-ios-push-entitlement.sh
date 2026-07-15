#!/usr/bin/env bash
set -euo pipefail

: "${PROFILE_PATH:?Missing PROFILE_PATH}"
: "${XCODE_PROJECT:?Missing XCODE_PROJECT}"

PROFILE_PLIST="$RUNNER_TEMP/acuarionexo-profile.plist"
security cms -D -i "$PROFILE_PATH" > "$PROFILE_PLIST"
PROFILE_APS=$(/usr/libexec/PlistBuddy -c 'Print Entitlements:aps-environment' "$PROFILE_PLIST")
test "$PROFILE_APS" = production

cat > ios/App/App/App.entitlements <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>aps-environment</key><string>production</string>
</dict></plist>
EOF

PBX="$XCODE_PROJECT/project.pbxproj"
python3 - "$PBX" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
needle = "PRODUCT_BUNDLE_IDENTIFIER = com.acuarionexo.app;"
replacement = "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.acuarionexo.app;"
if "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;" not in s:
    count = s.count(needle)
    if count < 2:
        raise SystemExit(f"Expected at least 2 bundle settings, found {count}")
    s = s.replace(needle, replacement)
p.write_text(s)
PY

grep -q 'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;' "$PBX"
printf 'profile_aps_environment=%s\nproject_entitlements=App/App.entitlements\n' "$PROFILE_APS" > push-entitlement-audit.txt
