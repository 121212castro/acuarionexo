#!/usr/bin/env bash
set -euo pipefail

BUNDLE_ID="com.acuarionexo.app"
APP_PATH="${1:-ios-build/Build/Products/Debug-iphonesimulator/App.app}"
DEVICE_NAME="${IOS_SIMULATOR_DEVICE:-iPhone 16}"
RUNTIME="${IOS_SIMULATOR_RUNTIME:-com.apple.CoreSimulator.SimRuntime.iOS-18-5}"

: > ios-simulator-audit.log
exec > >(tee -a ios-simulator-audit.log) 2>&1

echo "AcuarioNexo iOS Simulator audit"
echo "App: ${APP_PATH}"
echo "Device: ${DEVICE_NAME}"

if [[ ! -d "${APP_PATH}" ]]; then
  echo "No existe la aplicación compilada: ${APP_PATH}" >&2
  exit 1
fi

xcrun simctl list devices available > ios-simulator-devices.txt
xcrun simctl list runtimes > ios-simulator-runtimes.txt

UDID="$(xcrun simctl list devices available -j | python3 -c '
import json,sys
name=sys.argv[1]
data=json.load(sys.stdin)
for devices in data.get("devices", {}).values():
    for device in devices:
        if device.get("isAvailable") and device.get("name") == name:
            print(device["udid"])
            raise SystemExit
' "${DEVICE_NAME}")"

if [[ -z "${UDID}" ]]; then
  RUNTIME_ID="$(xcrun simctl list runtimes -j | python3 -c '
import json,sys
preferred=sys.argv[1]
data=json.load(sys.stdin)
runtimes=[r for r in data.get("runtimes",[]) if r.get("isAvailable") and "iOS" in r.get("name","")]
match=next((r for r in runtimes if r.get("identifier")==preferred), None)
if not match and runtimes: match=runtimes[-1]
print(match.get("identifier","") if match else "")
' "${RUNTIME}")"
  [[ -n "${RUNTIME_ID}" ]] || { echo "No hay runtime iOS disponible" >&2; exit 1; }
  DEVICE_TYPE="$(xcrun simctl list devicetypes -j | python3 -c '
import json,sys
data=json.load(sys.stdin)
preferred=next((d for d in data.get("devicetypes",[]) if d.get("name")=="iPhone 16"), None)
if not preferred: preferred=next((d for d in data.get("devicetypes",[]) if d.get("name","").startswith("iPhone")), None)
print(preferred.get("identifier","") if preferred else "")
')"
  [[ -n "${DEVICE_TYPE}" ]] || { echo "No hay tipo de dispositivo iPhone" >&2; exit 1; }
  UDID="$(xcrun simctl create "AcuarioNexo iPhone" "${DEVICE_TYPE}" "${RUNTIME_ID}")"
fi

echo "UDID=${UDID}" | tee ios-simulator-selection.txt
xcrun simctl boot "${UDID}" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID "${UDID}" || true
xcrun simctl bootstatus "${UDID}" -b

xcrun simctl uninstall "${UDID}" "${BUNDLE_ID}" 2>/dev/null || true
xcrun simctl install "${UDID}" "${APP_PATH}" | tee ios-install.txt

xcrun simctl spawn "${UDID}" log erase || true
xcrun simctl launch --terminate-running-process "${UDID}" "${BUNDLE_ID}" | tee ios-launch.txt
sleep 12

APP_INFO="$(xcrun simctl get_app_container "${UDID}" "${BUNDLE_ID}" app)"
echo "${APP_INFO}" | tee ios-app-container.txt
[[ -n "${APP_INFO}" && -d "${APP_INFO}" ]] || { echo "La app no quedó instalada" >&2; exit 1; }

xcrun simctl io "${UDID}" screenshot ios-launch.png
xcrun simctl spawn "${UDID}" log show --style compact --last 3m --predicate 'process == "App" OR subsystem CONTAINS "capacitor"' > ios-console.log || true

if grep -Eqi 'Terminating app due to uncaught exception|fatal error|SIGABRT|watchdog.*termination' ios-console.log; then
  echo "Se detectó un cierre fatal en iOS Simulator" >&2
  exit 1
fi

echo "success" > ios-simulator-result.txt
echo "AcuarioNexo permanece instalada y arrancó sin cierre fatal en iOS Simulator."
