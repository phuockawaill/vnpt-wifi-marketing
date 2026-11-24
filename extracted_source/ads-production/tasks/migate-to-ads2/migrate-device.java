/* Migrate to ads2 - device */

/* ip */
ctx._source.ip = ctx._source.ipAddr;

/* meta */
def meta = ['non': 'non'];
def metafs = [
  'advertiserId', 'publisherId', 'brandId', 'campaignId', 'adUnitId', 'adGroupId', 'campaignCategoryId',
  'ap', 'locationId', 'realLocationId', 'locationCategoryId', 'bannerId',
  'count', 'campaignCount', 'adUnitCount', 'adGroupCount', 'locationCount', 'cityCount'
];
for (field in metafs) {
  if (ctx._source.containsKey(field) && ctx._source[field] != null) {
    meta[field] = ctx._source[field];
    ctx._source.remove(field);
  }
}
meta.remove('non');
ctx._source.meta = meta;

/* phone */
def phoneCarriers = ['Viettel', 'Mobifone', 'Vinaphone', 'Vietnammobile', 'Gmobile'];
def phoneHeads = [
  ['086', '096', '097', '098', '0162', '0163', '0164', '0165', '0166', '0167', '0168', '0169', '032', '033', '034', '035', '036', '037', '038', '039'],
  ['089', '090', '093', '0120', '0121', '0122', '0126', '0128', '070', '079', '077', '076', '078'],
  ['088', '091', '094', '0123', '0124', '0125', '0127', '0129', '083', '084', '085', '081', '082'],
  ['092', '0188', '0186'],
  ['099', '0199', '059']
];
if (ctx._source.containsKey('phone') && ctx._source.phone != null) {
  def phone = ctx._source.phone;
  if (phone.startsWith('84')) {
    phone = '0' + phone.substring(2);
    ctx._source['phone'] = phone;
  }

  for (int i = 0, size = phoneCarriers.size(); i < size; i++) {
    for (head in phoneHeads[i]) {
      if (phone.startsWith(head)) {
        ctx._source['phoneCarrier'] = phoneCarriers[i];
        break;
      }
    }
    if (ctx._source['phoneCarrier'] != null) break;
  }
}

/* audience */
def audience = ['non': 'non'];
def audiencefs = [
  'name', 'email', 'phone', 'phoneCarrier', 'phoneVerified',
  'age', 'gender', 'income', 'marital', 'country', 'os', 'device'
];
for (field in audiencefs) {
  if (ctx._source.containsKey(field)) {
    if (ctx._source[field] != null && ctx._source[field] != 'other') {
      audience[field] = ctx._source[field];
    }
    ctx._source.remove(field);
  }
}
audience.remove('non');
ctx._source.audience = audience;

/* ua */
ctx._source.uaString = ctx._source.ua;

/* remove */
def removefs = [
  'ipAddr', 'actionType', 'campaignCount', 'locationCount', 'cityCount',
  'advertiserName', 'brandName', 'campaignName', 'campaignCategoryName',
  'locationName', 'realLocationName', 'locationCategoryName', 'bannerName', 'cityName',
  'platform', 'osVersion', 'browser', 'browserVersion', 'deviceModel', 'ua'
];
for (field in removefs) {
  ctx._source.remove(field);
}
