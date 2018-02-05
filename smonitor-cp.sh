#!/usr/bin/env bash
if [ x$BASH = x ] || [ ! $BASH_VERSINFO ] || [ $BASH_VERSINFO -lt 4 ]; then
  echo "Error: Must use bash version 4+." >&2
  exit 1
fi
set -ue

SourceDefault=/galaxy/home/nick/cron/public_html
DestDefault=/afs/bx.psu.edu/user/n/nick/public_html
PAUSE_DEFAULT=1m

if [[ $HOME == ${SourceDefault:0:${#HOME}} ]]; then
  src_abbrv=~${SourceDefault:${#HOME}}
else
  src_abbrv=$SourceDefault
fi

Usage="Usage: \$ $(basename $0) source/ destination/ [pause]
This script copies any files in source/ to destination/ every [pause] seconds.
It's the daemon that dies all the time and has to be run manually, like so:
\$ nohup ~/code/smonitor-cp.sh $src_abbrv $DestDefault >/dev/null 2>/dev/null &"

function main {
  if [[ $# -lt 2 ]] || [[ $1 == '-h' ]]; then
    fail "$Usage"
  fi

  source=$1
  dest=$2
  pause=$PAUSE_DEFAULT
  if [[ $# -ge 3 ]]; then
    pause=$3
  fi

  while true; do
    for file in $(ls $source); do
      cp -a $source/$file $dest
    done
    sleep $pause
  done
}

function fail {
  echo "$@" >&2
  exit 1
}

main "$@"
