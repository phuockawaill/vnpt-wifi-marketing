ES_HOST="localhost:59200"

curl -u elastic -XPUT $ES_HOST/_template/ads2-default -d '{
  "order": 0,
  "template": "ads2-*",
  "mappings": {
    "_default_": {
      "_all": {
        "enabled": false
      }
    }
  }
}'


curl -u elastic -XPUT $ES_HOST/_template/ads2-base -d '{
  "order": 10,
  "template": "ads2-*",
  "settings": {
    "number_of_replicas": 0,
    "number_of_shards": 6,
    "refresh_interval": "15s",
    "analysis": {
      "filter": {
        "email": {
          "type": "pattern_capture",
          "preserve_original": 1,
          "patterns": [
            "([^@]+)",
            "(\\p{L}+)",
            "(\\d+)",
            "@(.+)",
            "([^-@]+)"
          ]
        }
      },
      "analyzer": {
        "email": {
          "tokenizer": "uax_url_email",
          "filter": [
            "email",
            "lowercase",
            "unique"
          ]
        }
      }
    }
  },
  "mappings": {
    "Tracking": {
      "properties": {
        "id": { "type": "keyword" },
        "ip": { "type": "ip" },
        "mac": {
          "type": "keyword",
          "fields": {
            "hash": { "type": "murmur3" }
          }
        },
        "count": { "type": "integer" },
        "actions": {
          "type": "nested",
          "properties": {
            "time": { "type": "date" },
            "action": { "type": "keyword" }
          }
        },

        "meta": {
          "type": "object",
          "properties": {
            "advertiserId": { "type": "keyword" },
            "brandId": { "type": "keyword" },
            "publisherId": { "type": "keyword" },
            "campaignId": { "type": "keyword" },
            "campaignCategoryId": { "type": "keyword" },
            "ap": { "type": "keyword" },
            "locationId": { "type": "keyword" },
            "realLocationId": { "type": "keyword" },
            "locationCategoryId": { "type": "keyword" },
            "cityId": { "type": "keyword" },
            "bannerId": { "type": "keyword" },

            "count": { "type": "integer" },
            "locationCount": { "type": "integer" },
            "campaignCount": { "type": "integer" }
          }
        },

        "uaString": { "type": "keyword", "doc_values": false },
        "ua": {
          "properties": {
            "name": { "type": "keyword" },
            "major": { "type": "integer" },
            "minor": { "type": "integer" },
            "patch": { "type": "integer" },
            "build": { "type": "integer" },
            "os": { "type": "keyword" },
            "os_name": { "type": "keyword" },
            "os_major": { "type": "integer" },
            "os_minor": { "type": "integer" },
            "device": {
              "type": "text",
              "fields": {
                "keyword": { "type": "keyword" }
              }
            }
          }
        },

        "createdAt": { "type": "date" },
        "updatedAt": { "type": "date" }
      },
      "dynamic_templates": [
        {
          "default_string": {
            "match_mapping_type": "string",
            "mapping": { "type": "keyword" }
          }
        },
        {
          "default_number": {
            "match_mapping_type": "long",
            "mapping": { "type": "integer" }
          }
        }
      ]
    },
    "Device": {
      "properties": {
        "ip": { "type": "ip" },
        "mac": { "type": "keyword" },

        "meta": {
          "type": "object",
          "properties": {
            "advertiserId": { "type": "keyword" },
            "brandId": { "type": "keyword" },
            "publisherId": { "type": "keyword" },
            "campaignId": { "type": "keyword" },
            "campaignCategoryId": { "type": "keyword" },
            "ap": { "type": "keyword" },
            "locationId": { "type": "keyword" },
            "realLocationId": { "type": "keyword" },
            "locationCategoryId": { "type": "keyword" },
            "cityId": { "type": "keyword" },
            "bannerId": { "type": "keyword" },

            "count": { "type": "integer" },
            "campaignCount": { "type": "integer" },
            "locationCount": { "type": "integer" },
            "cityCount": { "type": "integer" }
          }
        },

        "audience": {
          "type": "object",
          "properties": {
            "os": { "type": "keyword" },
            "device": { "type": "keyword" },
            "name": { "type": "text" },
            "email": { "type": "text", "analyzer": "email" },
            "emailVerified": { "type": "boolean" },
            "gender": { "type": "keyword" },
            "age": { "type": "keyword" },
            "income": { "type": "keyword" },
            "marital": { "type": "keyword" },
            "country": { "type": "keyword" },
            "phone": { "type": "keyword" },
            "phoneCarrier": { "type": "keyword" },
            "phoneVerified": { "type": "boolean" },
            "source": { "type": "keyword" }
          }
        },

        "fb": {
          "type": "nested",
          "properties": {
            "fbId": { "type": "keyword" },
            "fbName": { "type": "text" },
            "email": { "type": "text" },
            "gender": { "type": "text" }
          }
        },

        "google": {
          "type": "nested",
          "properties": {
            "id": { "type": "keyword" },
            "email": { "type": "text" },
            "name": { "type": "text" }
          }
        },

        "zalo": {
          "type": "nested",
          "properties": {
            "id": { "type": "keyword" },
            "birthday": { "type": "text" },
            "gender": { "type": "text" }
          }
        },

        "twitter": {
          "type": "nested",
          "properties": {
            "id": { "type": "keyword" }
          }
        },

        "survey": { "type": "object" },

        "createdAt": { "type": "date" },
        "updatedAt": { "type": "date" }
      },
      "dynamic_templates": [
        {
          "default_string": {
            "match_mapping_type": "string",
            "mapping": { "type": "keyword" }
          }
        },
        {
          "default_number": {
            "match_mapping_type": "long",
            "mapping": { "type": "integer" }
          }
        }
      ]
    }
  }
}'

curl -u elastic -XPOST "http://$ES_HOST/_scripts/migrate-tracking" -H 'Content-Type: application/json' -d'
{
  "script": {
    "lang": "painless",
    "code": "/* Migrate to ads2 - tracking */ /* actions */ ctx._source.ip = ctx._source.ipAddr; def actions = [[ \"time\": ctx._source.createdAt, \"action\": ctx._source.actionType ]]; ctx._source.actions = actions; def meta = [\"non\": \"non\"]; def metafs = [ \"advertiserId\", \"publisherId\", \"brandId\", \"campaignId\", \"campaignCategoryId\", \"ap\", \"locationId\", \"realLocationId\", \"locationCategoryId\", \"bannerId\" ]; for (field in metafs) { if (ctx._source.containsKey(field) && ctx._source[field] != null) { meta[field] = ctx._source[field]; ctx._source.remove(field); } } meta.remove(\"non\"); ctx._source.meta = meta; ctx._source.uaString = ctx._source.ua; /* audience */ def audience = [\"non\": \"non\"]; def audiencefs = [ \"os\", \"device\" ]; for (field in audiencefs) { if (ctx._source.containsKey(field)) { audience[field] = ctx._source[field]; ctx._source.remove(field); } } audience.remove(\"non\"); ctx._source.audience = audience; /* remove unused fields */ def removefs = [ \"advertiserName\", \"brandName\", \"campaignName\", \"campaignCategoryName\", \"locationName\", \"realLocationName\", \"locationCategoryName\", \"bannerName\", \"cityName\", \"ipAddr\", \"platform\", \"osVersion\", \"browser\", \"browserVersion\", \"deviceModel\", \"ua\", \"os\", \"device\", \"actionType\" ]; for (field in removefs) { ctx._source.remove(field); } "
  }
}'

curl -u elastic -XPOST "http://$ES_HOST/_scripts/migrate-device" -H 'Content-Type: application/json' -d'
{
  "script": {
    "lang": "painless",
    "code": "/* Migrate to ads2 - device */ /* ip */ ctx._source.ip = ctx._source.ipAddr; /* meta */ def meta = [\"non\": \"non\"]; def metafs = [ \"advertiserId\", \"publisherId\", \"brandId\", \"campaignId\", \"campaignCategoryId\", \"ap\", \"locationId\", \"realLocationId\", \"locationCategoryId\", \"bannerId\", \"count\", \"campaignCount\", \"locationCount\", \"cityCount\" ]; for (field in metafs) { if (ctx._source.containsKey(field) && ctx._source[field] != null) { meta[field] = ctx._source[field]; ctx._source.remove(field); } } meta.remove(\"non\"); ctx._source.meta = meta; /* phone */ def phoneCarriers = [\"Viettel\", \"Mobifone\", \"Vinaphone\", \"Vietnammobile\", \"Gmobile\"]; def phoneHeads = [ [\"086\", \"096\", \"097\", \"098\", \"0162\", \"0163\", \"0164\", \"0165\", \"0166\", \"0167\", \"0168\", \"0169\"], [\"089\", \"090\", \"093\", \"0120\", \"0121\", \"0122\", \"0126\", \"0128\"], [\"088\", \"091\", \"094\", \"0123\", \"0124\", \"0125\", \"0127\", \"0129\"], [\"092\", \"0188\", \"0186\"], [\"099\", \"0199\"] ]; if (ctx._source.containsKey(\"phone\") && ctx._source.phone != null) { def phone = ctx._source.phone; if (phone.startsWith(\"84\")) { phone = \"0\" + phone.substring(2); ctx._source[\"phone\"] = phone; } for (int i = 0, size = phoneCarriers.size(); i < size; i++) { for (head in phoneHeads[i]) { if (phone.startsWith(head)) { ctx._source[\"phoneCarrier\"] = phoneCarriers[i]; break; } } if (ctx._source[\"phoneCarrier\"] != null) break; } } /* audience */ def audience = [\"non\": \"non\"]; def audiencefs = [ \"name\", \"email\", \"phone\", \"phoneCarrier\", \"phoneVerified\", \"age\", \"gender\", \"income\", \"marital\", \"country\", \"os\", \"device\" ]; for (field in audiencefs) { if (ctx._source.containsKey(field)) { if (ctx._source[field] != null && ctx._source[field] != \"other\") { audience[field] = ctx._source[field]; } ctx._source.remove(field); } } audience.remove(\"non\"); ctx._source.audience = audience; /* ua */ ctx._source.uaString = ctx._source.ua; /* remove */ def removefs = [ \"ipAddr\", \"actionType\", \"campaignCount\", \"locationCount\", \"cityCount\", \"advertiserName\", \"brandName\", \"campaignName\", \"campaignCategoryName\", \"locationName\", \"realLocationName\", \"locationCategoryName\", \"bannerName\", \"cityName\", \"platform\", \"osVersion\", \"browser\", \"browserVersion\", \"deviceModel\", \"ua\" ]; for (field in removefs) { ctx._source.remove(field); }"
  }
}'

curl -u elastic -XPOST "http://$ES_HOST/_scripts/upsert-tracking-v1" -H 'Content-Type: application/json' -d'
{
  "script": {
    "lang": "painless",
    "code": "/* actions - actionType */ def action = [\"action\": params[\"actionType\"], \"time\": ctx._now]; def actions = []; if (ctx._source.containsKey(\"actions\")) { actions = ctx._source.actions; } actions.add(action); ctx._source.actions = actions; /* meta */ if (!ctx._source.containsKey(\"meta\")) { def meta = [\"non\": \"non\"]; def metafs = [ \"advertiserId\", \"publisherId\", \"brandId\", \"campaignId\", \"campaignCategoryId\", \"ap\", \"locationId\", \"realLocationId\", \"locationCategoryId\", \"bannerId\", \"cityId\" ]; for (field in metafs) { if (params.containsKey(field)) { meta[field] = params[field]; } } meta.remove(\"non\"); ctx._source.meta = meta; } /* audience */ if (!ctx._source.containsKey(\"audience\")) { def audience = [\"non\": \"non\"]; def audiencefs = [ \"os\", \"device\" ]; for (field in audiencefs) { if (params.containsKey(field)) { audience[field] = params[field]; } } audience.remove(\"non\"); ctx._source.audience = audience; } /* update if not exists */ def updatefs = [ \"mac\", \"ip\", \"uaString\", \"count\", \"isNew\" ]; for (field in updatefs) { if (!ctx._source.containsKey(field) && params.containsKey(field)) { ctx._source[field] = params[field]; } } /* createdAt - updatedAt */ if (!ctx._source.containsKey(\"createdAt\")) { ctx._source.createdAt = ctx._now; } ctx._source.updatedAt = ctx._now;"
  }
}'

curl -u elastic -XPOST "http://$ES_HOST/_scripts/upsert-device-v1" -H 'Content-Type: application/json' -d'
{
  "script": {
    "lang": "painless",
    "code": "/* meta */ def meta = [\"non\": \"non\"]; if (ctx._source.containsKey(\"meta\")) { meta = ctx._source.meta; } def metafs = [ \"advertiserId\", \"publisherId\", \"brandId\", \"campaignId\", \"campaignCategoryId\", \"ap\", \"locationId\", \"realLocationId\", \"locationCategoryId\", \"bannerId\", \"cityId\" ]; for (field in metafs) { if (!meta.containsKey(field)) { meta[field] = []; } if (params.containsKey(field) && !meta[field].contains(params[field])) { meta[field].add(params[field]); } } /* meta count */ if (meta.containsKey(\"count\")) { meta.count++; } else { meta.count = 1; } meta.campaignCount = meta[\"campaignId\"].size(); meta.locationCount = meta[\"locationId\"].size(); meta.cityCount = meta[\"cityId\"].size(); meta.remove(\"non\"); ctx._source.meta = meta; /* audience */ def audience = [\"non\": \"non\"]; if (ctx._source.containsKey(\"audience\")) { audience = ctx._source[\"audience\"]; } def audiencefs = [ \"name\", \"email\", \"emailVerified\", \"phone\", \"phoneVerified\", \"age\", \"gender\", \"income\", \"marital\", \"country\", \"os\", \"device\" ]; for (field in audiencefs) { if (params.containsKey(field)) { audience[field] = params[field]; } } /* phone */ def phoneCarriers = [\"Viettel\", \"Mobifone\", \"Vinaphone\", \"Vietnammobile\", \"Gmobile\"]; def phoneHeads = [ [\"086\", \"096\", \"097\", \"098\", \"0162\", \"0163\", \"0164\", \"0165\", \"0166\", \"0167\", \"0168\", \"0169\"], [\"089\", \"090\", \"093\", \"0120\", \"0121\", \"0122\", \"0126\", \"0128\"], [\"088\", \"091\", \"094\", \"0123\", \"0124\", \"0125\", \"0127\", \"0129\"], [\"092\", \"0188\", \"0186\"], [\"099\", \"0199\"] ]; if (audience.containsKey(\"phone\") && audience.phone != null) { def phone = audience.phone; if (phone.startsWith(\"84\")) { phone = \"0\" + phone.substring(2); audience[\"phone\"] = phone; } for (int i = 0, size = phoneCarriers.size(); i < size; i++) { for (head in phoneHeads[i]) { if (phone.startsWith(head)) { audience[\"phoneCarrier\"] = phoneCarriers[i]; break; } } if (audience[\"phoneCarrier\"] != null) break; } } audience.remove(\"non\"); ctx._source.audience = audience; /* merge fb, google, zalo, twitter and survey */ def mergefs = [\"fb\", \"google\", \"zalo\", \"twitter\", \"survey\"]; for (field in mergefs) { if (params.containsKey(field)) { def data = [\"non\": \"non\"]; if (ctx._source.containsKey(field)) { data = ctx._source[field]; } data.putAll(params[field]); data.remove(\"non\"); ctx._source[field] = data; } } /* update if not exists */ def updatefs = [ \"mac\", \"ip\", \"uaString\" ]; for (field in updatefs) { if ((!ctx._source.containsKey(field) || ctx._source[field] == null) && params.containsKey(field)) { ctx._source[field] = params[field]; } } /* createdAt - updatedAt */ if (!ctx._source.containsKey(\"createdAt\")) { ctx._source.createdAt = ctx._now; } ctx._source.updatedAt = ctx._now;"
  }
}'
