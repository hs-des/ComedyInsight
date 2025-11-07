#!/bin/sh
# Wait for a list of host:port dependencies to become reachable
# Usage: wait-for-deps.sh host1:port1 host2:port2 -- command args...
set -eu

TIMEOUT="${WAIT_FOR_TIMEOUT:-60}"
SLEEP_INTERVAL="${WAIT_FOR_INTERVAL:-2}"

deps=""
cmd=""
for arg in "$@"; do
  if [ "$arg" = "--" ]; then
    shift
    cmd="$@"
    break
  fi
  deps="$deps $arg"
  shift
done

if [ -z "$deps" ]; then
  echo "wait-for-deps: no dependencies provided" >&2
  exit 1
fi

for dep in $deps; do
  host=$(echo "$dep" | cut -d: -f1)
  port=$(echo "$dep" | cut -d: -f2)
  echo "wait-for-deps: waiting for $host:$port (timeout ${TIMEOUT}s)..."

  deadline=$(( $(date +%s) + TIMEOUT ))
  while :; do
    if node -e "
      const net = require('net');
      const socket = net.connect({host: '${host}', port: ${port}}, () => {
        socket.end();
        process.exit(0);
      });
      socket.on('error', () => process.exit(1));
      socket.setTimeout(1000, () => {
        socket.destroy();
        process.exit(1);
      });
    "; then
      break
    fi

    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "wait-for-deps: timeout while waiting for $host:$port" >&2
      exit 1
    fi
    sleep "$SLEEP_INTERVAL"
  done

  echo "wait-for-deps: $host:$port is available"
done

if [ -n "$cmd" ]; then
  echo "wait-for-deps: executing command '$cmd'"
  exec sh -c "$cmd"
fi

