#!/bin/sh
# Generate dSYMs for prebuilt React Native frameworks so App Store Connect
# upload does not warn about missing UUID-matched DWARF files.
#
# Affects: React.framework, ReactNativeDependencies.framework, hermesvm.framework
# See: https://github.com/facebook/react-native/issues/54638

set -e

if [ "${CONFIGURATION}" != "Release" ]; then
  echo "note: Skipping RN dSYM generation (CONFIGURATION=${CONFIGURATION})"
  exit 0
fi

if [ -z "${DWARF_DSYM_FOLDER_PATH}" ]; then
  echo "warning: DWARF_DSYM_FOLDER_PATH is empty; skipping RN dSYM generation"
  exit 0
fi

mkdir -p "${DWARF_DSYM_FOLDER_PATH}"

generate_dsym() {
  FRAMEWORK_NAME="$1"
  BINARY_NAME="$2"
  EMBEDDED_BIN="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/${FRAMEWORK_NAME}.framework/${BINARY_NAME}"
  DSYM_OUTPUT="${DWARF_DSYM_FOLDER_PATH}/${FRAMEWORK_NAME}.framework.dSYM"

  BIN=""
  if [ -f "${EMBEDDED_BIN}" ]; then
    BIN="${EMBEDDED_BIN}"
  else
    case "${FRAMEWORK_NAME}" in
      hermesvm)
        BIN="$(find "${PODS_ROOT}/hermes-engine" -path "*/ios-arm64/hermesvm.framework/hermesvm" -type f 2>/dev/null | head -n 1)"
        ;;
      React)
        BIN="$(find "${PODS_ROOT}/React-Core-prebuilt" -path "*/ios-arm64/React.framework/React" -type f 2>/dev/null | head -n 1)"
        ;;
      ReactNativeDependencies)
        BIN="$(find "${PODS_ROOT}/ReactNativeDependencies" -path "*/ios-arm64/ReactNativeDependencies.framework/ReactNativeDependencies" -type f 2>/dev/null | head -n 1)"
        ;;
    esac
  fi

  if [ -z "${BIN}" ] || [ ! -f "${BIN}" ]; then
    echo "warning: ${FRAMEWORK_NAME} binary not found; skipping dSYM"
    return 0
  fi

  NEED_REGEN=1
  if [ -d "${DSYM_OUTPUT}" ]; then
    BIN_UUIDS="$(dwarfdump --uuid "${BIN}" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    DSYM_UUIDS="$(dwarfdump --uuid "${DSYM_OUTPUT}" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    if [ -n "${BIN_UUIDS}" ] && [ "${BIN_UUIDS}" = "${DSYM_UUIDS}" ]; then
      NEED_REGEN=0
      echo "note: ${FRAMEWORK_NAME} dSYM already present and UUIDs match"
    else
      echo "note: ${FRAMEWORK_NAME} dSYM UUID mismatch; regenerating"
    fi
  else
    echo "note: Generating ${FRAMEWORK_NAME}.framework.dSYM"
  fi

  if [ "${NEED_REGEN}" -eq 1 ]; then
    rm -rf "${DSYM_OUTPUT}"
    # Prebuilt binaries may lack local object files; dsymutil still emits a
    # UUID-matched dSYM which satisfies App Store Connect upload checks.
    xcrun dsymutil "${BIN}" -o "${DSYM_OUTPUT}" || {
      echo "warning: dsymutil failed for ${FRAMEWORK_NAME}"
      return 0
    }
  fi
}

generate_dsym "hermesvm" "hermesvm"
generate_dsym "React" "React"
generate_dsym "ReactNativeDependencies" "ReactNativeDependencies"

echo "note: RN dSYM generation finished → ${DWARF_DSYM_FOLDER_PATH}"
exit 0
