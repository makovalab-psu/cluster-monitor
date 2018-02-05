#!/usr/bin/env bash
if [ x$BASH = x ] || [ ! $BASH_VERSINFO ] || [ $BASH_VERSINFO -lt 4 ]; then
  echo "Error: Must use bash version 4+." >&2
  exit 1
fi
set -ue

LockFile=smonitor.pid
ScriptName=$(basename $0)

Usage="Usage: \$ $ScriptName my/cron/dir"

function main {
  if [[ $# -lt 1 ]] || [[ $1 == '-h' ]]; then
    fail "$Usage"
  fi
  work_dir=$1
  lock_path=$work_dir/$LockFile

  set +e
  if already_running $lock_path; then
    fail "Error: Looks like it's already running (pid $(cat $lock_path))."
  fi
  set -e
  echo $$ > $lock_path

  html_dir=$work_dir/public_html
  if ! [[ -d $html_dir ]]; then
    mkdir -p $html_dir
  fi
  date=$(date)

  echo -e "As of $date:\n" > $html_dir/jobs.txt
  squeue -o '%.7i %Q %.8u %.8T %.10M %6h %14R %j' | sort -g -k 2 >> $html_dir/jobs.txt

  echo -e "As of $date:\n" > $html_dir/myjobs.txt
  squeue -u $USER -o '%.7i %Q %.8u %.8T %.10M %6h %14R %j' >> $html_dir/myjobs.txt

  echo -e "As of $date:\n" > $html_dir/cpus.txt
  sinfo -h -p general -t idle,alloc -o '%n %C' | tr ' /' '\t\t' | cut -f 1,3 | sort -k 1.3g >> $html_dir/cpus.txt

  echo -e "As of $date:\n" > $html_dir/sinfo.txt
  sinfo >> $html_dir/sinfo.txt

  rm $lock_path
}

function already_running {
  lock_path="$1"
  if [[ -s $lock_path ]]; then
    pid=$(cat $lock_path)
  else
    return 1
  fi
  awk_script='
$1 == "'$USER'" && $2 == '$pid' {
  for (i=11; i<=NF; i++) {
    if ($i ~ /\/'$ScriptName'$/) {
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
