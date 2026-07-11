#!/usr/bin/env bash
set -u

: > android-emulator-setup.txt
: > android-avd-create.txt
: > android-avd-list.txt
: > android-emulator.log
: > android-install.txt
: > android-start.txt
: > android-activities.txt
: > android-logcat.txt
: > app-pid.txt
: > android-adb-status.txt
: > android-package.txt

SDKMANAGER="$(find "$ANDROID_HOME" -type f -name sdkmanager 2>/dev/null | head -n 1)"
AVDMANAGER="$(find "$ANDROID_HOME" -type f -name avdmanager 2>/dev/null | head -n 1)"
ADB_BIN="$(find "$ANDROID_HOME" -type f -path '*/platform-tools/adb' 2>/dev/null | head -n 1)"

printf 'ANDROID_HOME=%s\nSDKMANAGER=%s\nAVDMANAGER=%s\nADB=%s\n' \
  "$ANDROID_HOME" "$SDKMANAGER" "$AVDMANAGER" "$ADB_BIN" | tee android-sdk-paths.txt

test -x "$SDKMANAGER" || exit 20
test -x "$AVDMANAGER" || exit 21
test -x "$ADB_BIN" || exit 23

export PATH="$(dirname "$SDKMANAGER"):$(dirname "$ADB_BIN"):$PATH"

yes | "$SDKMANAGER" --licenses >/dev/null 2>&1 || true
"$SDKMANAGER" "platform-tools" "emulator" "system-images;android-34;google_apis;x86_64" > android-emulator-setup.txt 2>&1 || exit 24

EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"
test -x "$EMULATOR_BIN" || exit 22
printf 'EMULATOR=%s\n' "$EMULATOR_BIN" | tee -a android-sdk-paths.txt
export PATH="$(dirname "$EMULATOR_BIN"):$PATH"

echo no | "$AVDMANAGER" create avd --force --name AcuarioNexoTest --package "system-images;android-34;google_apis;x86_64" --device "pixel_6" > android-avd-create.txt 2>&1 || exit 25
"$AVDMANAGER" list avd > android-avd-list.txt 2>&1 || exit 26
AVD_INI="$(find "$HOME" -type f -path '*/.android/avd/AcuarioNexoTest.ini' 2>/dev/null | head -n 1)"
printf 'AVD_INI=%s\n' "$AVD_INI" | tee -a android-sdk-paths.txt
test -f "$AVD_INI" || exit 27

export ANDROID_AVD_HOME="$(dirname "$AVD_INI")"
printf 'ANDROID_AVD_HOME=%s\n' "$ANDROID_AVD_HOME" | tee -a android-sdk-paths.txt

"$ADB_BIN" kill-server >/dev/null 2>&1 || true
nohup "$EMULATOR_BIN" -avd AcuarioNexoTest -no-window -gpu swiftshader_indirect -noaudio -no-boot-anim -no-snapshot -camera-back none -no-metrics > android-emulator.log 2>&1 &
EMULATOR_PID=$!
printf 'EMULATOR_PID=%s\n' "$EMULATOR_PID" >> android-adb-status.txt

cleanup() {
  "$ADB_BIN" emu kill >/dev/null 2>&1 || true
  kill "$EMULATOR_PID" >/dev/null 2>&1 || true
  wait "$EMULATOR_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

timeout 180s "$ADB_BIN" wait-for-device >> android-adb-status.txt 2>&1
DEVICE_STATUS=$?

BOOT_STATUS=1
BOOT_COMPLETED=""
for attempt in $(seq 1 180); do
  BOOT_COMPLETED="$(timeout 5s "$ADB_BIN" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
  if [ "$BOOT_COMPLETED" = "1" ]; then
    BOOT_STATUS=0
    break
  fi
  if ! kill -0 "$EMULATOR_PID" 2>/dev/null; then
    break
  fi
  sleep 2
done
printf 'BOOT_COMPLETED=%s\n' "$BOOT_COMPLETED" >> android-adb-status.txt

timeout 10s "$ADB_BIN" shell input keyevent 82 >> android-adb-status.txt 2>&1 || true
timeout 10s "$ADB_BIN" shell wm dismiss-keyguard >> android-adb-status.txt 2>&1 || true

timeout 120s "$ADB_BIN" install -r -g AcuarioNexo-Android-Test.apk > android-install.txt 2>&1
INSTALL_STATUS=$?

timeout 15s "$ADB_BIN" shell cmd package resolve-activity --brief -c android.intent.category.LAUNCHER com.acuarionexo.app > android-package.txt 2>&1
PACKAGE_STATUS=$?

timeout 10s "$ADB_BIN" logcat -c >> android-adb-status.txt 2>&1 || true
timeout 10s "$ADB_BIN" shell am force-stop com.acuarionexo.app >> android-adb-status.txt 2>&1 || true

timeout 30s "$ADB_BIN" shell am start -W -S -n com.acuarionexo.app/.MainActivity > android-start.txt 2>&1
START_STATUS=$?
sleep 10

timeout 10s "$ADB_BIN" shell pidof com.acuarionexo.app > app-pid.txt 2>/dev/null
PID_STATUS=$?

timeout 20s "$ADB_BIN" shell dumpsys activity activities > android-activities.txt 2>&1
ACTIVITY_STATUS=$?
timeout 15s "$ADB_BIN" shell dumpsys window windows >> android-activities.txt 2>&1 || true
timeout 15s "$ADB_BIN" exec-out screencap -p > android-launch.png 2>/dev/null || true
timeout 20s "$ADB_BIN" logcat -d -v threadtime > android-logcat.txt 2>&1
LOGCAT_STATUS=$?

printf 'DEVICE_STATUS=%s\nBOOT_STATUS=%s\nINSTALL_STATUS=%s\nPACKAGE_STATUS=%s\nSTART_STATUS=%s\nPID_STATUS=%s\nACTIVITY_STATUS=%s\nLOGCAT_STATUS=%s\n' \
  "$DEVICE_STATUS" "$BOOT_STATUS" "$INSTALL_STATUS" "$PACKAGE_STATUS" "$START_STATUS" "$PID_STATUS" "$ACTIVITY_STATUS" "$LOGCAT_STATUS" >> android-adb-status.txt

FAILURE=0
test "$DEVICE_STATUS" -eq 0 || FAILURE=1
test "$BOOT_STATUS" -eq 0 || FAILURE=1
test "$INSTALL_STATUS" -eq 0 || FAILURE=1
test "$PACKAGE_STATUS" -eq 0 || FAILURE=1
test "$START_STATUS" -eq 0 || FAILURE=1
test "$PID_STATUS" -eq 0 || FAILURE=1
test "$ACTIVITY_STATUS" -eq 0 || FAILURE=1
test "$LOGCAT_STATUS" -eq 0 || FAILURE=1
test -s app-pid.txt || FAILURE=1
grep -qE 'com\.acuarionexo\.app/(\.MainActivity|com\.acuarionexo\.app\.MainActivity)|mResumedActivity:.*com\.acuarionexo\.app|topResumedActivity=.*com\.acuarionexo\.app|mCurrentFocus=.*com\.acuarionexo\.app' android-activities.txt || FAILURE=1
if grep -A 30 'FATAL EXCEPTION' android-logcat.txt | grep -q 'Process: com.acuarionexo.app'; then FAILURE=1; fi
if grep -qE 'ANR in com\.acuarionexo\.app|Force finishing activity .*com\.acuarionexo\.app|Process com\.acuarionexo\.app .* has died' android-logcat.txt; then FAILURE=1; fi

cat android-install.txt
cat android-package.txt
cat android-start.txt
cat android-adb-status.txt
exit "$FAILURE"
