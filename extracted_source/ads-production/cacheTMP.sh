curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Tracking/90489a52c516?pretty'
curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/_snapshot/_all?pretty'
curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/_snapshot/_status?pretty'


curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Device/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "mac": "00:0C:29:DA:76:86" }
  }
}
'
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Tracking/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "meta.campaignId": "5adda1dcde801b4eddaa91b8" }
  }
}
'
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Visit/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  },
  "size": 0,
  "aggs": {
      "website": {
          "terms": { "field": "site", "size" : 20 }
      }
  }
}
'
90489a52c516
curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Device/60f6777e39fc?pretty'
curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Tracking/ddffa17054bd11e8bde9a1e9c3e615e2?pretty'
ddffa17054bd11e8bde9a1e9c3e615e2
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Tracking/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
      "bool": {
          "should": [
            { "term": { "mac": "00:11:22:33:44:77" }},
            { "term": { "mac": "84:A1:34:58:90:AD" }}
          ]
      }
  },
  "size": 0,
  "aggs": {
      "mac": {
        "terms": { "field": "mac"},
        "aggs": {
            "campaign": {
              "terms": { "field": "meta.campaignId"},
              "aggs": {
                  "location": {
                      "terms": { "field": "meta.locationId", "size": 100 },
                      "aggs": {
                        "clickAggs": {
                          "nested": { "path": "actions" },
                          "aggs": { "action": { "terms": { "field": "actions.action", "size": 2  } } }
                        }
                      }
                  }
              }
            }
        }
      }
  }
}
'
curl -X POST  --user 'elastic:wifiex4u3slactic123qwe!@#' "localhost:59200/ads2-v1/Device/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {
          "nested": {
            "path": "google",
            "query": {
              "match_all": { }
            }
          }
        }
      ]
    }
  },
  "size": 0
}
'
curl -XGET  --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/_snapshot/_all?pretty'

curl -XDELETE --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Device/2c4d547bfece?pretty'
curl -X POST  --user 'elastic:wifiex4u3slactic123qwe!@#' "localhost:59200/ads2-v1/Visit/_delete_by_query?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "subject": "" }
  }
}
'

curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Visit/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": { "site": "m.kenh14.vn" }
  }
}
'
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Visit/AWL7tY9d413JhJe4gX69/_update?pretty' -H 'Content-Type: application/json' -d'
{
    "script" : "ctx._source.site = \u0027kenh14.vn\u0027"
}
'

curl -X POST --user 'elastic:wifiex4u3slactic123qwe!@#' "localhost:59200/ads2-v1/Visit/_update_by_query" -H 'Content-Type: application/json' -d'
{
  "script": {
    "inline": "ctx._source.site  = \u0027phimmoi.net\u0027",
    "lang": "painless"
  },
  "query": {
    "match": { "site": "www.phimmoi.net" }
  }
}
'



curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Device/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must_not": [
        {"exists": {"field": "fb"}},
        {"exists": {"field": "google"}},
        {"exists": {"field": "zalo"}},
        {"exists": {"field": "twitter"}}
      ]
    }
  },
  "size": 0
}
'
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Device/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  },
  "size": 0,
  "aggs":{
    "source": {
      "filter": {
        "bool": {
          "must_not": [
            { "nested" : {  "path" : "fb"} },
            { "nested" : {  "path" : "google"} }
          ]
        }
      }
    }
  }
}
'
curl -XPOST --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Tracking/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
     "bool": {
       "should": [
         {
           "term": {
             "mac": "00:0C:29:DA:76:86"
           }
         }
       ]
     }
   },
   "size": 0,
   "aggs": {
     "mac": {
       "terms": {
         "field": "mac"
       },
       "aggs": {
         "campaign": {
           "terms": {
             "field": "meta.campaignId"
           },
           "aggs": {
             "location": {
               "terms": {
                 "field": "meta.locationId",
                 "size": 100
               },
               "aggs": {
                 "clickAggs": {
                   "nested": {
                     "path": "actions"
                   },
                   "aggs": {
                     "action": {
                       "terms": {
                         "field": "actions.action",
                         "size": 2
                       }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
   }
}
'


PORT=7005 MONGO_URL="mongodb://localhost:27017/thanhhoaitest" MONGO_OPLOG_URL="mongodb://localhost:27017/local" ROOT_URL="https://thtest.s2corp.vn/admin" METEOR_SETTINGS='{"public":"buildmodify","env":"buildmodify","client":"thtest","email":"th@gmail.com","config":{"title":"Thanh Hoai","email":"thanhhoai@gmail.com","billNote":"Thank"}}' pm2 start main.js --name="thtest" -f

sessionId: 'a983f7e0364d11e8bf287f0026a6fcf9'


getVoucherData
obj.listMac {mac, vou}
obj.listVou {vou, time}

redis.multip([["HSET", "rad_voucher", loginInfo.voucher, moment(limitations.expire).subtract(config.VOUCHER.SURVEY_BEFORE, config.VOUCHER.SURVEY_EXPIRE_TYPE?config.VOUCHER.SURVEY_EXPIRE_TYPE:'minutes').valueOf()]]);

curl -XPUT --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/_mapping/Device?pretty' -H 'Content-Type: application/json' -d'
{
  "properties": {
    "google": {
      "type": "nested",
      "properties": {
        "id": {
          "type": "keyword"
        },
        "email": {
          "type": "text"
        },
        "name": {
          "type": "text"
        }
      }
    }
  }
}
'
curl -XGET --user 'elastic:wifiex4u3slactic123qwe!@#' 'localhost:59200/ads2-v1/Visit/_search?pretty' -d '
{
  "query": {
    "match_all": {}
  },
  "size": 0,
  "aggs": {
    "website": {
      "terms": {
        "field": "site",
        "size": 100
      }
    }
  }
}
'
