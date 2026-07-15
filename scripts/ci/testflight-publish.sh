#!/usr/bin/env bash
set -euo pipefail
trap 'rc=$?; echo "TestFlight publish failed at line ${LINENO}: ${BASH_COMMAND}" >&2; exit $rc' ERR

: "${CERT_PATH:?Missing validated CERT_PATH}"
: "${PROFILE_PATH:?Missing validated PROFILE_PATH}"
: "${PROFILE_UUID:?Missing validated PROFILE_UUID}"
: "${PROFILE_NAME:?Missing validated PROFILE_NAME}"
: "${ASC_KEY_PATH:?Missing validated ASC_KEY_PATH}"
: "${DIST_P12_PASSWORD:?Missing P12 password}"
: "${ASC_KEY_ID:?Missing App Store Connect key ID}"
: "${ASC_ISSUER_ID:?Missing App Store Connect issuer ID}"
: "${MARKETING_VERSION:?Missing marketing version}"
: "${BUILD_NUMBER:?Missing build number}"

KEYCHAIN_PATH="$RUNNER_TEMP/acuarionexo-signing.keychain-db"
KEYCHAIN_PASSWORD="$(openssl rand -hex 24)"
echo "KEYCHAIN_PATH=$KEYCHAIN_PATH" >> "$GITHUB_ENV"

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security import "$CERT_PATH" -P "$DIST_P12_PASSWORD" -A -f pkcs12 -k "$KEYCHAIN_PATH"
security list-keychains -d user -s "$KEYCHAIN_PATH" login.keychain-db
security default-keychain -d user -s "$KEYCHAIN_PATH"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security find-identity -v -p codesigning "$KEYCHAIN_PATH" | tee signing-identities.txt
grep -F 'Apple Distribution' signing-identities.txt

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$PROFILE_PATH" "$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"

rm -rf ios ios-build
mkdir -p ios-build
npx cap add ios 2>&1 | tee -a testflight-build.log
npm run mobile:assets:prepare 2>&1 | tee -a testflight-build.log
npx --yes @capacitor/assets@3.0.5 generate --ios --iconBackgroundColor '#02111f' --splashBackgroundColor '#02111f' 2>&1 | tee -a testflight-build.log
npx cap sync ios 2>&1 | tee -a testflight-build.log

# cap sync may regenerate native project files. Apply and verify all APNs native wiring afterwards.
bash scripts/ci/enable-ios-push-entitlement.sh 2>&1 | tee -a testflight-build.log
bash scripts/ci/enable-ios-push-appdelegate.sh 2>&1 | tee -a testflight-build.log

test -f "$XCODE_PROJECT/project.pbxproj"
test -f ios/App/App/Info.plist
test -f ios/App/App/App.entitlements
test -f ios/App/App/AppDelegate.swift
grep -q 'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;' "$XCODE_PROJECT/project.pbxproj"
grep -q '<key>aps-environment</key>' ios/App/App/App.entitlements
grep -q 'capacitorDidRegisterForRemoteNotifications' ios/App/App/AppDelegate.swift
grep -q 'capacitorDidFailToRegisterForRemoteNotifications' ios/App/App/AppDelegate.swift
/usr/libexec/PlistBuddy -c "Set :NSPhotoLibraryUsageDescription AcuarioNexo usa tus fotos para guardar imagenes de acuarios, animales y fichas." ios/App/App/Info.plist 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :NSPhotoLibraryUsageDescription string AcuarioNexo usa tus fotos para guardar imagenes de acuarios, animales y fichas." ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Set :NSPhotoLibraryAddUsageDescription AcuarioNexo guarda imagenes exportadas en tu biblioteca si lo solicitas." ios/App/App/Info.plist 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :NSPhotoLibraryAddUsageDescription string AcuarioNexo guarda imagenes exportadas en tu biblioteca si lo solicitas." ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Set :NSCameraUsageDescription AcuarioNexo usa la camara para capturar fotos de tus acuarios cuando eliges hacer una foto." ios/App/App/Info.plist 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string AcuarioNexo usa la camara para capturar fotos de tus acuarios cuando eliges hacer una foto." ios/App/App/Info.plist
xcodebuild -project "$XCODE_PROJECT" -list | tee ios-project-list.txt
grep -F "$BUNDLE_ID" "$XCODE_PROJECT/project.pbxproj"
grep -Eq '^[[:space:]]*App$' ios-project-list.txt

cat > ios-identity.txt <<EOF_IDENTITY
project=$XCODE_PROJECT
scheme=$XCODE_SCHEME
target=App
bundle_id=$BUNDLE_ID
team_id=$TEAM_ID
push_entitlements=App/App.entitlements
push_appdelegate_callbacks=verified
EOF_IDENTITY

printf 'marketing_version=%s\nbuild_number=%s\n' "$MARKETING_VERSION" "$BUILD_NUMBER" > ios-version.txt

xcodebuild \
  -project "$XCODE_PROJECT" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  MARKETING_VERSION="$MARKETING_VERSION" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY='Apple Distribution' \
  PROVISIONING_PROFILE_SPECIFIER="$PROFILE_NAME" \
  OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN_PATH" \
  clean archive 2>&1 | tee -a testflight-build.log

test -d "$ARCHIVE_PATH"
mkdir -p "$EXPORT_PATH"
cat > "$RUNNER_TEMP/ExportOptions.plist" <<EOF_EXPORT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>export</string>
<key>signingStyle</key><string>manual</string>
<key>teamID</key><string>$TEAM_ID</string>
<key>provisioningProfiles</key><dict><key>$BUNDLE_ID</key><string>$PROFILE_NAME</string></dict>
<key>stripSwiftSymbols</key><true/>
<key>uploadSymbols</key><true/>
</dict></plist>
EOF_EXPORT

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$RUNNER_TEMP/ExportOptions.plist" \
  OTHER_CODE_SIGN_FLAGS="--keychain $KEYCHAIN_PATH" \
  2>&1 | tee -a testflight-build.log

IPA_PATH=$(find "$EXPORT_PATH" -maxdepth 1 -type f -name '*.ipa' -print -quit)
test -n "$IPA_PATH"
cp "$IPA_PATH" AcuarioNexo-TestFlight.ipa

VALIDATION_DIR="$RUNNER_TEMP/ipa-validation"
rm -rf "$VALIDATION_DIR"
mkdir -p "$VALIDATION_DIR"
ditto -x -k AcuarioNexo-TestFlight.ipa "$VALIDATION_DIR"
APP_PATH=$(find "$VALIDATION_DIR/Payload" -maxdepth 1 -type d -name '*.app' -print -quit)
test -n "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH" 2>&1 | tee ipa-codesign-verification.txt
codesign -d --entitlements :- "$APP_PATH" > "$RUNNER_TEMP/ipa-entitlements.plist" 2>ipa-entitlements-command.txt
IPA_APS=$(/usr/libexec/PlistBuddy -c 'Print :aps-environment' "$RUNNER_TEMP/ipa-entitlements.plist")
test "$IPA_APS" = production
IPA_BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP_PATH/Info.plist")
IPA_VERSION=$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' "$APP_PATH/Info.plist")
IPA_BUILD=$(/usr/libexec/PlistBuddy -c 'Print CFBundleVersion' "$APP_PATH/Info.plist")
test "$IPA_BUNDLE" = "$BUNDLE_ID"
test "$IPA_VERSION" = "$MARKETING_VERSION"
test "$IPA_BUILD" = "$BUILD_NUMBER"
security cms -D -i "$APP_PATH/embedded.mobileprovision" > "$RUNNER_TEMP/embedded-profile.plist"
EMBEDDED_APP_ID=$(/usr/libexec/PlistBuddy -c 'Print Entitlements:application-identifier' "$RUNNER_TEMP/embedded-profile.plist")
EMBEDDED_APS=$(/usr/libexec/PlistBuddy -c 'Print Entitlements:aps-environment' "$RUNNER_TEMP/embedded-profile.plist")
test "$EMBEDDED_APP_ID" = "$TEAM_ID.$BUNDLE_ID"
test "$EMBEDDED_APS" = production
shasum -a 256 AcuarioNexo-TestFlight.ipa | tee AcuarioNexo-TestFlight.ipa.sha256

cat > ipa-validation.txt <<EOF_IPA
ipa=AcuarioNexo-TestFlight.ipa
bundle_id=$IPA_BUNDLE
marketing_version=$IPA_VERSION
build_number=$IPA_BUILD
embedded_application_identifier=$EMBEDDED_APP_ID
embedded_profile_aps_environment=$EMBEDDED_APS
signed_app_aps_environment=$IPA_APS
appdelegate_registration_callback=verified
appdelegate_registration_error_callback=verified
codesign=verified
EOF_IPA

ASC_KEYS_DIR="$HOME/.appstoreconnect/private_keys"
mkdir -p "$ASC_KEYS_DIR"
chmod 700 "$HOME/.appstoreconnect" "$ASC_KEYS_DIR"
cp "$ASC_KEY_PATH" "$ASC_KEYS_DIR/AuthKey_${ASC_KEY_ID}.p8"
chmod 600 "$ASC_KEYS_DIR/AuthKey_${ASC_KEY_ID}.p8"
echo "api_key_path=$ASC_KEYS_DIR/AuthKey_${ASC_KEY_ID}.p8" > app-store-connect-key-audit.txt

xcrun altool --upload-app \
  --type ios \
  --file AcuarioNexo-TestFlight.ipa \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID" \
  2>&1 | tee app-store-connect-upload.log

grep -Eq 'UPLOAD SUCCEEDED|No errors uploading' app-store-connect-upload.log