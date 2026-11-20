#!/bin/bash
# Xcode archive/build has no nvm/Homebrew PATH — do not call `node` here.
set -euo pipefail

ENV_FILE="${SRCROOT}/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "error: missing mobileFlagship/.env — copy .env.example and set GOOGLE_MAPS_IOS_API_KEY" >&2
  exit 1
fi

read_env_key() {
  local file="$1"
  local want="$2"
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [ -z "$line" ] && continue
    case "$line" in
      \#*) continue ;;
    esac
    key="${line%%=*}"
    key="${key%"${key##*[![:space:]]}"}"
    [ "$key" = "$want" ] || continue
    val="${line#*=}"
    val="${val#"${val%%[![:space:]]*}"}"
    val="${val%"${val##*[![:space:]]}"}"
    if [ "${#val}" -ge 2 ]; then
      case "$val" in
        \"*\") val="${val#\"}"; val="${val%\"}" ;;
        \'*\') val="${val#\'}"; val="${val%\'}" ;;
      esac
    fi
    printf '%s' "$val"
    return 0
  done < "$file"
  return 1
}

KEY="$(read_env_key "$ENV_FILE" "GOOGLE_MAPS_IOS_API_KEY" || true)"
if [ -z "${KEY}" ]; then
  echo "error: GOOGLE_MAPS_IOS_API_KEY is empty in mobileFlagship/.env" >&2
  exit 1
fi

inject_plist() {
  local plist="$1"
  [ -f "$plist" ] || return 1
  /usr/libexec/PlistBuddy -c "Set :GMSApiKey '${KEY}'" "$plist" \
    || /usr/libexec/PlistBuddy -c "Add :GMSApiKey string '${KEY}'" "$plist"
}

FOUND=0
CANDIDATES=(
  "${TARGET_BUILD_DIR:-}/${INFOPLIST_PATH:-}"
  "${BUILT_PRODUCTS_DIR:-}/${INFOPLIST_PATH:-}"
  "${TARGET_BUILD_DIR:-}/${WRAPPER_NAME:-}/Info.plist"
  "${BUILT_PRODUCTS_DIR:-}/${WRAPPER_NAME:-}/Info.plist"
  "${CONFIGURATION_BUILD_DIR:-}/${WRAPPER_NAME:-}/Info.plist"
)

# Archive: app bundle Info.plist under the .xcarchive payload.
if [ -n "${TARGET_BUILD_DIR:-}" ] && [ -n "${WRAPPER_NAME:-}" ]; then
  while IFS= read -r found; do
    CANDIDATES+=("$found")
  done < <(find "${TARGET_BUILD_DIR}" -maxdepth 4 -name Info.plist -path "*${WRAPPER_NAME}*" 2>/dev/null || true)
fi

SEEN=""
for plist in "${CANDIDATES[@]}"; do
  [ -n "$plist" ] || continue
  [ -f "$plist" ] || continue
  case "$SEEN" in
    *"|$plist|"*) continue ;;
  esac
  SEEN="${SEEN}|$plist|"
  if inject_plist "$plist"; then
    echo "note: injected GMSApiKey into $plist"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "error: built Info.plist not found (archive/build). TARGET_BUILD_DIR=${TARGET_BUILD_DIR:-unset} INFOPLIST_PATH=${INFOPLIST_PATH:-unset}" >&2
  exit 1
fi
