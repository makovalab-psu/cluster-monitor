#!/usr/bin/env bash
if [ "x$BASH" = x ] || [ ! "$BASH_VERSINFO" ] || [ "$BASH_VERSINFO" -lt 4 ]; then
  echo "Error: Must use bash version 4+." >&2
  exit 1
fi
set -ue

USER=${USER:-nick}
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

  print_jobs "$date" > "$output_dir/jobs.txt"

  print_jobs "$date" "$USER" > "$output_dir/myjobs.txt"

  print_cpus "$date" > "$output_dir/cpus.txt"

  print_sinfo "$date" > "$output_dir/sinfo.txt"

  rm "$lock_path"
}

function print_jobs {
  date="$1"
  if [[ "$#" -ge 2 ]]; then
    user_arg="-u $2"
  else
    user_arg=
  fi
  echo "As of $date:"
  echo
  echo '  JOBID PRIORITY     USER      STATE        TIME     MEM SHARED NODE           NAME'
  squeue -h -p general $user_arg -o '%.7i %.8Q %.8u %.10T %.11M %.7m %6h %14R %j' | sort -g -k 2
}

function print_cpus {
  date="$1"
  echo "As of $date:"
  echo
  echo -e "\tTotal\tFree\tFree"
  echo -e "Node\tCPUs\tCPUs\tMem (GB)"
  sinfo -h -p general -t idle,alloc -o '%n %C %e' | tr '/' ' ' \
    | awk '{split($1, fields, "."); printf("%s\t%d\t%d\t%3.0f\n", fields[1], $5, $3, $6/1024)}' \
    | sort -k 2g -k 1
}

function print_sinfo {
  date="$1"
  echo "As of $date:"
  echo
  sinfo
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
