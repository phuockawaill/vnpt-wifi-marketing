/* Migrate to ads2 - tracking */

/* actions */
ctx._source.ip = ctx._source.ipAddr;

def actions = [[ 'time': ctx._source.createdAt, 'action': ctx._source.actionType ]];
ctx._source.actions = actions;

def meta = ['non': 'non'];
def metafs = [
  'advertiserId', 'publisherId', 'brandId', 'campaignId', 'adUnitId', 'adGroupId', 'campaignCategoryId',
  'ap', 'locationId', 'realLocationId', 'locationCategoryId', 'bannerId'
];
for (field in metafs) {
  if (ctx._source.containsKey(field) && ctx._source[field] != null) {
    meta[field] = ctx._source[field];
    ctx._source.remove(field);
  }
}

meta.remove('non');
ctx._source.meta = meta;
ctx._source.uaString = ctx._source.ua;

/* audience */
def audience = ['non': 'non'];
def audiencefs = [
  'os', 'device'
];

for (field in audiencefs) {
  if (ctx._source.containsKey(field)) {
    audience[field] = ctx._source[field];
    ctx._source.remove(field);
  }
}
audience.remove('non');
ctx._source.audience = audience;

/* remove unused fields */
def removefs = [
  'advertiserName', 'brandName', 'campaignName', 'campaignCategoryName',
  'locationName', 'realLocationName', 'locationCategoryName', 'bannerName', 'cityName',
  'ipAddr', 'platform', 'osVersion', 'browser', 'browserVersion', 'deviceModel',
  'ua', 'os', 'device', 'actionType'
];
for (field in removefs) {
  ctx._source.remove(field);
}
