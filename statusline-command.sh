#!/bin/bash
input=$(cat)

# Extract fields
raw_cwd=$(echo "$input" | jq -r '.cwd // .workspace.current_dir // "."')
model=$(echo "$input" | jq -r '.model.display_name // "?"')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
remaining_pct=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')

ESC=$'\033'

# --- Model ---
model_part="[${model}]"

# --- Current dir (basename) ---
dir_part="📁 ${raw_cwd##*/}"

# --- Git branch ---
branch_part=""
if git -C "$raw_cwd" rev-parse --git-dir > /dev/null 2>&1; then
  git_branch=$(git -C "$raw_cwd" symbolic-ref --short HEAD 2>/dev/null \
    || git -C "$raw_cwd" rev-parse --short HEAD 2>/dev/null)

  if [ -n "$git_branch" ]; then
    remote_url=$(git -C "$raw_cwd" remote get-url origin 2>/dev/null)
    if [ -n "$remote_url" ]; then
      if echo "$remote_url" | grep -qE '^git@'; then
        https_url=$(echo "$remote_url" | sed -E 's|^git@([^:]+):(.+?)\.git$|https://\1/\2|')
      else
        https_url=$(echo "$remote_url" | sed -E 's|https?://[^@]*@|https://|' | sed -E 's|\.git$||')
      fi
      branch_url="${https_url}/tree/${git_branch}"
      branch_part="${ESC}]8;;${branch_url}${ESC}\\${git_branch}${ESC}]8;;${ESC}\\"
    else
      branch_part="$git_branch"
    fi
  fi
fi

# --- Context bar ---
if [ -n "$used_pct" ]; then
  filled=$(echo "$used_pct" | awk '{printf "%d", ($1 / 10 + 0.5)}')
  bar=""
  for i in $(seq 1 10); do
    if [ "$i" -le "$filled" ]; then bar="${bar}█"; else bar="${bar}░"; fi
  done
  ctx_part="[${bar}] ${used_pct}%"
else
  ctx_part="[░░░░░░░░░░] --%"
fi

# --- Session left ---
session_part="${remaining_pct:---}%"

# Colors
C_RESET="${ESC}[0m"
C_MODEL="${ESC}[38;5;111m"   # blue - model
C_DIR="${ESC}[38;5;214m"     # orange - directory
C_BRANCH="${ESC}[38;5;114m"  # green - branch
C_CTX="${ESC}[38;5;244m"     # gray - context bar
C_SESSION="${ESC}[38;5;220m" # yellow - session
C_SEP="${ESC}[38;5;240m"     # dark gray - separator

SEP="${C_SEP} | ${C_RESET}"

# --- Assemble: [model] 📁 dir | branch | bar% | ⚡left% ---
printf "%s%s%s %s%s%s" "${C_MODEL}" "${model_part}" "${C_RESET}" "${C_DIR}" "${dir_part}" "${C_RESET}"
[ -n "$branch_part" ] && printf "%s%s%s" "${SEP}" "${C_BRANCH}" "${branch_part}"
printf "%s%s%s%s" "${C_RESET}" "${SEP}" "${C_CTX}" "${ctx_part}"
printf "%s%s | ⚡%s%s" "${C_RESET}" "${C_SEP}" "${C_SESSION}" "${session_part}"
printf "%s" "${C_RESET}"
