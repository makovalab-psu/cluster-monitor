#!/usr/bin/env bash
if [ "x$BASH" = x ] || [ ! "$BASH_VERSINFO" ] || [ "$BASH_VERSINFO" -lt 4 ]; then
  echo "Error: Must use bash version 4+." >&2
  exit 1
fi
set -ue

USER=${USER:-nick}
SqueueHeader='  JOBID PRIORITY     USER    STATE        TIME   MEM SHARED NODE           NAME'
SqueueFormat='%.7i %.8Q %.8u %.8T %.11M %.5m %6h %14R %j'
LockFile=.smonitor.pid
ScriptName=$(basename "$0")

Usage="Usage: \$ $ScriptName my/cron/dir"

function main {
  if [[ "$#" -lt 1 ]] || [[ "$1" == '-h' ]]; then
    fail "$Usage"
  fi
  output_dir="$1"
  lock_path="$output_dir/$LockFile"

  set +e
  if already_running "$lock_path"; then
    fail "Error: Looks like it's already running (pid $(cat "$lock_path"))."
  fi
  set -e
  echo "$$" > "$lock_path"

  date=$(date)

  echo -e "As of $date:\n\n$SqueueHeader" > "$output_dir/jobs.txt"
  squeue -h -o "$SqueueFormat" | sort -g -k 2 >> "$output_dir/jobs.txt"

  echo -e "As of $date:\n\n$SqueueHeader" > "$output_dir/myjobs.txt"
  squeue -h -o "$SqueueFormat" -u "$USER" >> "$output_dir/myjobs.txt"

  echo -e "As of $date:\n\nNode\tFree\tTotal" > "$output_dir/cpus.txt"
  sinfo -h -p general -t idle,alloc -o '%n %C' | tr ' /' '\t\t' | cut -f 1,3,5 | sort -k 1.3g \
    | sed -E 's/\.c\.bx\.psu\.edu//' >> "$output_dir/cpus.txt"

  echo -e "As of $date:\n" > "$output_dir/sinfo.txt"
  sinfo >> "$output_dir/sinfo.txt"

  rm "$lock_path"
}

function already_running {
  lock_path="$1"
  if [[ -s "$lock_path" ]]; then
    pid=$(cat "$lock_path")
  else
    return 1
  fi
  awk_script='
$1 == "'"$USER"'" && $2 == '"$pid"' {
  for (i=11; i<=NF; i++) {
    if ($i ~ /\/'"$ScriptName"'$/) {
      print $i
    }
  }
}'
  if [[ $(ps aux | awk "$awk_script") ]]; then
    return 0
  else
    return 1
  fi
}

function fail {
  echo "$@" >&2
  exit 1
}

main "$@"
