#!/bin/bash
MAC=$1
[ -z "$MAC" ] && exit 1
curl -X POST --user 'elastic:wifiex4u3slactic123qwe!@#' "localhost:59200/ads2-v1/Tracking/_delete_by_query?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "mac": "'"$MAC"'" }
  }
}
'

curl -X POST --user 'elastic:wifiex4u3slactic123qwe!@#' "localhost:59200/ads2-v1/Device/_delete_by_query?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "mac": "'"$MAC"'" }
  }
}
'

echo "cleared MAC: $MAC"
