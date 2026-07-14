#!/usr/bin/env python3
"""Strictly validate every Apple credential before building AcuarioNexo."""

from __future__ import annotations

import base64
import binascii
import os
import plistlib
import re
import subprocess
import sys
from pathlib import Path

TEAM_ID = "636BUY8Z9W"
BUNDLE_ID = "com.acuarionexo.app"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def require(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        fail(f"Missing GitHub Actions secret: {name}")
    return value


def run(command: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, text=True, capture_output=capture)
    if result.returncode != 0:
        if capture:
            print(result.stdout, file=sys.stderr)
            print(result.stderr, file=sys.stderr)
        fail(f"Command failed: {' '.join(command)}")
    return result


def decode_base64(secret_name: str, destination: Path) -> int:
    raw = require(secret_name)
    compact = "".join(raw.split())
    if len(compact) < 32:
        fail(f"{secret_name} is too short to contain a complete encoded file")
    try:
        decoded = base64.b64decode(compact, validate=True)
    except (binascii.Error, ValueError) as exc:
        fail(f"{secret_name} is not valid standard Base64: {exc}")
    if not decoded:
        fail(f"{secret_name} decoded to an empty file")
    destination.write_bytes(decoded)
    print(f"{secret_name}: decoded {len(decoded)} bytes")
    return len(decoded)


def normalize_api_key(secret: str) -> str:
    value = secret.strip().replace("\r", "")

    # GitHub secrets are sometimes pasted with escaped newlines.
    if "\\n" in value and "-----BEGIN" in value:
        value = value.replace("\\n", "\n")

    # Preferred form: the PEM file contents were pasted directly.
    if "-----BEGIN PRIVATE KEY-----" in value:
        return value.rstrip() + "\n"

    # Also accept Base64 of the complete AuthKey_*.p8 file.
    compact = "".join(value.split())
    try:
        decoded = base64.b64decode(compact, validate=True).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError, ValueError):
        fail(
            "APP_STORE_CONNECT_PRIVATE_KEY is neither a PEM private key nor valid Base64 of an AuthKey .p8 file"
        )

    decoded = decoded.replace("\r", "").strip()
    if "\\n" in decoded and "-----BEGIN" in decoded:
        decoded = decoded.replace("\\n", "\n")
    return decoded.rstrip() + "\n"


def validate_api_key(path: Path) -> None:
    private_key = normalize_api_key(require("ASC_PRIVATE_KEY"))
    if not re.search(r"^-----BEGIN PRIVATE KEY-----$", private_key, re.MULTILINE):
        fail("APP_STORE_CONNECT_PRIVATE_KEY has no BEGIN PRIVATE KEY marker after normalization")
    if not re.search(r"^-----END PRIVATE KEY-----$", private_key, re.MULTILINE):
        fail("APP_STORE_CONNECT_PRIVATE_KEY has no END PRIVATE KEY marker after normalization")
    path.write_text(private_key, encoding="utf-8")
    path.chmod(0o600)
    run(["openssl", "pkey", "-in", str(path), "-noout", "-check"], capture=True)
    print("APP_STORE_CONNECT_PRIVATE_KEY: normalized and validated")


def validate_p12(path: Path, password: str, temp: Path) -> None:
    base = ["openssl", "pkcs12"]
    common = ["-in", str(path), "-passin", f"pass:{password}"]
    probe = subprocess.run(base + common + ["-info", "-noout"], capture_output=True, text=True)
    legacy = False
    if probe.returncode != 0:
        probe = subprocess.run(base + ["-legacy"] + common + ["-info", "-noout"], capture_output=True, text=True)
        legacy = probe.returncode == 0
    if probe.returncode != 0:
        fail("IOS_DISTRIBUTION_P12_BASE64 or IOS_DISTRIBUTION_P12_PASSWORD is invalid")

    prefix = base + (["-legacy"] if legacy else []) + common
    cert_pem = temp / "distribution-certificate.pem"
    key_pem = temp / "distribution-private-key.pem"
    run(prefix + ["-clcerts", "-nokeys", "-out", str(cert_pem)], capture=True)
    run(prefix + ["-nocerts", "-nodes", "-out", str(key_pem)], capture=True)
    cert_text = cert_pem.read_text(encoding="utf-8", errors="replace")
    key_text = key_pem.read_text(encoding="utf-8", errors="replace")
    if "BEGIN CERTIFICATE" not in cert_text:
        fail("The .p12 does not contain a certificate")
    if "PRIVATE KEY" not in key_text:
        fail("The .p12 does not contain the matching private key")
    audit = run(["openssl", "x509", "-in", str(cert_pem), "-noout", "-subject", "-issuer", "-dates"], capture=True)
    Path("distribution-certificate-audit.txt").write_text(audit.stdout, encoding="utf-8")
    cert_pem.unlink(missing_ok=True)
    key_pem.unlink(missing_ok=True)


def validate_profile(path: Path, plist_path: Path) -> tuple[str, str]:
    decoded = run(["security", "cms", "-D", "-i", str(path)], capture=True).stdout
    plist_path.write_text(decoded, encoding="utf-8")
    with plist_path.open("rb") as handle:
        profile = plistlib.load(handle)
    uuid = str(profile.get("UUID", ""))
    name = str(profile.get("Name", ""))
    teams = profile.get("TeamIdentifier") or []
    team = str(teams[0]) if teams else ""
    app_id = str((profile.get("Entitlements") or {}).get("application-identifier", ""))
    if not uuid or not name:
        fail("The provisioning profile has no UUID or Name")
    if team != TEAM_ID:
        fail(f"Provisioning profile Team ID is {team!r}, expected {TEAM_ID!r}")
    expected_app_id = f"{TEAM_ID}.{BUNDLE_ID}"
    if app_id != expected_app_id:
        fail(f"Provisioning profile application identifier is {app_id!r}, expected {expected_app_id!r}")
    Path("provisioning-profile-audit.txt").write_text(
        f"name={name}\nuuid={uuid}\napplication_identifier={app_id}\nteam_id={team}\n",
        encoding="utf-8",
    )
    return uuid, name


def append_env(values: dict[str, str]) -> None:
    env_file = Path(require("GITHUB_ENV"))
    with env_file.open("a", encoding="utf-8") as handle:
        for key, value in values.items():
            handle.write(f"{key}={value}\n")


def main() -> None:
    require("ASC_KEY_ID")
    require("ASC_ISSUER_ID")
    password = require("DIST_P12_PASSWORD")
    temp = Path(require("RUNNER_TEMP"))
    cert = temp / "AcuarioNexo_Distribution.p12"
    profile = temp / "AcuarioNexo_App_Store.mobileprovision"
    api_key = temp / f"AuthKey_{require('ASC_KEY_ID')}.p8"
    profile_plist = temp / "AcuarioNexo_App_Store.plist"

    decode_base64("DIST_P12_BASE64", cert)
    decode_base64("PROFILE_BASE64", profile)
    validate_api_key(api_key)
    validate_p12(cert, password, temp)
    profile_uuid, profile_name = validate_profile(profile, profile_plist)
    append_env({
        "CERT_PATH": str(cert),
        "PROFILE_PATH": str(profile),
        "ASC_KEY_PATH": str(api_key),
        "PROFILE_UUID": profile_uuid,
        "PROFILE_NAME": profile_name,
    })
    Path("credentials-preflight.txt").write_text(
        "app_store_connect_private_key_valid=true\n"
        "distribution_p12_valid=true\n"
        "distribution_private_key_present=true\n"
        "provisioning_profile_valid=true\n"
        "provisioning_profile_matches_bundle=true\n"
        "provisioning_profile_matches_team=true\n",
        encoding="utf-8",
    )
    print("All Apple credentials passed strict preflight validation.")


if __name__ == "__main__":
    main()
