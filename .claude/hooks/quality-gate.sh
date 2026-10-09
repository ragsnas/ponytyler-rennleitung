#!/usr/bin/env bash
# Stop hook: when Claude thinks it is done, verify lint (with --fix), builds and tests.
# Blocks the stop (and feeds the failures back to Claude) if anything is red.
# Builds intentionally rewrite the tracked dist/ folders: dist should always hold the last build.
set -uo pipefail
input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

# ui/rl needs Node 26; hooks do not source nvm.
node26=$(ls -d "$HOME"/.nvm/versions/node/v26.* 2>/dev/null | sort -V | tail -n1)
[ -n "$node26" ] && export PATH="$node26/bin:$PATH"

SRC=(be/src be/test be/package.json ui/rl/projects ui/rl/src ui/rl/angular.json ui/rl/package.json)

fingerprint() {
  { git status --porcelain -- "${SRC[@]}"
    git diff HEAD -- "${SRC[@]}"
    git ls-files --others --exclude-standard -z -- "${SRC[@]}" | xargs -0 -r sha256sum
  } | sha256sum | cut -d' ' -f1
}

[ -z "$(git status --porcelain -- "${SRC[@]}")" ] && exit 0   # nothing changed (e.g. pure Q&A turn)

PASS=$(git rev-parse --git-path claude-gate.pass)
FAIL=$(git rev-parse --git-path claude-gate.fail)
fp=$(fingerprint)
[ "$fp" = "$(cat "$PASS" 2>/dev/null)" ] && exit 0            # already verified this exact state

# Claude was re-woken by this gate and changed nothing: stop instead of looping.
if [ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && [ "$fp" = "$(cat "$FAIL" 2>/dev/null)" ]; then
  jq -n '{systemMessage: "Quality gate still failing and nothing changed since the last attempt. Stopping; fix manually."}'
  exit 0
fi

errors=""
run() {  # run <label> <dir> <command...>
  local label=$1 dir=$2 out; shift 2
  if ! out=$(cd "$dir" && "$@" 2>&1); then
    errors+=$(printf '### %s failed (%s)\n%s\n\n' "$label" "$*" "$(tail -n 60 <<<"$out")")
  fi
}

# Order matters: lint --fix first (it edits source), then builds, then tests.
run "be lint (--fix)"   be     npm run lint
run "ui lint (--fix)"   ui/rl  npm run lint:fix
run "be build"          be     npm run build
run "ui build"          ui/rl  npm run build
run "be unit tests"     be     npx jest
run "ui tests"          ui/rl  npx ng test

fp=$(fingerprint)   # lint --fix may have changed the sources; record the final state
if [ -n "$errors" ]; then
  printf '%s' "$fp" > "$FAIL"
  jq -n --arg r "$(printf 'Quality gate failed. Fix these before finishing:\n\n%s' "$errors")" '{decision: "block", reason: $r}'
  exit 0
fi
printf '%s' "$fp" > "$PASS"; rm -f "$FAIL"
exit 0
