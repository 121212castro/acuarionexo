#!/usr/bin/env python3
"""Confirm that the uploaded AcuarioNexo build appears in App Store Connect."""

from __future__ import annotations

import json
import os
import time

import jwt
import requests


def required(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise SystemExit(f"Missing environment value: {name}")
    return value


KEY_ID = required("ASC_KEY_ID")
ISSUER_ID = required("ASC_ISSUER_ID")
PRIVATE_KEY = required("ASC_PRIVATE_KEY")
BUNDLE_ID = required("BUNDLE_ID")
EXPECTED_BUILD = required("EXPECTED_BUILD")


def token() -> str:
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now, "exp": now + 900, "aud": "appstoreconnect-v1"},
        PRIVATE_KEY,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def get(path: str, params: dict[str, str | int]) -> dict:
    response = requests.get(
        f"https://api.appstoreconnect.apple.com{path}",
        headers={"Authorization": f"Bearer {token()}"},
        params=params,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def main() -> None:
    apps = get("/v1/apps", {"filter[bundleId]": BUNDLE_ID, "limit": 5})["data"]
    if len(apps) != 1:
        raise SystemExit(f"Expected one App Store Connect app for {BUNDLE_ID}, found {len(apps)}")
    app_id = apps[0]["id"]

    deadline = time.time() + 1800
    found = None
    while time.time() < deadline:
        builds = get(
            "/v1/builds",
            {
                "filter[app]": app_id,
                "filter[version]": EXPECTED_BUILD,
                "sort": "-uploadedDate",
                "limit": 10,
            },
        )["data"]
        if builds:
            found = builds[0]
            break
        time.sleep(30)

    if not found:
        raise SystemExit(f"Build {EXPECTED_BUILD} did not appear in App Store Connect within 30 minutes")

    result = {
        "app_store_connect_app_id": app_id,
        "bundle_id": BUNDLE_ID,
        "build_id": found["id"],
        "build_number": found["attributes"].get("version"),
        "processing_state": found["attributes"].get("processingState"),
        "uploaded_date": found["attributes"].get("uploadedDate"),
        "appears_in_app_store_connect": True,
    }
    with open("testflight-build-confirmation.json", "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
