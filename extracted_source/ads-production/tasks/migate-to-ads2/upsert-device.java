/* meta */
def meta = ['non': 'non'];
if (ctx._source.containsKey('meta')) {
  meta = ctx._source.meta;
}
def metafs = [
  'advertiserId', 'publisherId', 'brandId', 'campaignId', 'adUnitId', 'adGroupId', 'campaignCategoryId',
  'ap', 'locationId', 'realLocationId', 'locationCategoryId', 'bannerId', 'cityId'
];
for (field in metafs) {
  if (!meta.containsKey(field)) {
    meta[field] = [];
  }

  if (params.containsKey(field) && !meta[field].contains(params[field])) {
    meta[field].add(params[field]);
  }
}

/* meta count */
if (meta.containsKey('count')) {
  meta.count++;
} else {
  meta.count = 1;
}
meta.campaignCount = meta['campaignId'].size();
meta.adUnitCount = meta['adUnitId'].size();
meta.adGroupCount = meta['adGroupId'].size();
meta.locationCount = meta['locationId'].size();
meta.cityCount = meta['cityId'].size();

meta.remove('non');
ctx._source.meta = meta;

/* audience */
def audience = ['non': 'non'];
if (ctx._source.containsKey('audience')) {
  audience = ctx._source['audience'];
}
def audiencefs = [
  'name', 'email', 'emailVerified', 'phone', 'phoneVerified',
  'age', 'gender', 'income', 'marital', 'country', 'os', 'device'
];
for (field in audiencefs) {
  if (params.containsKey(field)) {
    audience[field] = params[field];
  }
}

/* phone */
def phoneCarriers = ['Viettel', 'Mobifone', 'Vinaphone', 'Vietnammobile', 'Gmobile'];
def phoneHeads = [
  ['086', '096', '097', '098', '0162', '0163', '0164', '0165', '0166', '0167', '0168', '0169', '032', '033', '034', '035', '036', '037', '038', '039'],
  ['089', '090', '093', '0120', '0121', '0122', '0126', '0128', '070', '079', '077', '076', '078'],
  ['088', '091', '094', '0123', '0124', '0125', '0127', '0129', '083', '084', '085', '081', '082'],
  ['092', '0188', '0186'],
  ['099', '0199', '059']
];
if (audience.containsKey('phone') && audience.phone != null) {
  def phone = audience.phone;
  if (phone.startsWith('84')) {
    phone = '0' + phone.substring(2);
    audience['phone'] = phone;
  }

  for (int i = 0, size = phoneCarriers.size(); i < size; i++) {
    for (head in phoneHeads[i]) {
      if (phone.startsWith(head)) {
        audience['phoneCarrier'] = phoneCarriers[i];
        break;
      }
    }
    if (audience['phoneCarrier'] != null) break;
  }
}

audience.remove('non');
ctx._source.audience = audience;

/* merge fb and survey */
def mergefs = ['fb', 'google', 'zalo', 'twitter', 'survey'];
for (field in mergefs) {
  if (params.containsKey(field)) {
    def data = ['non': 'non'];
    if (ctx._source.containsKey(field)) {
      data = ctx._source[field];
    }
    data.putAll(params[field]);

    data.remove('non');
    ctx._source[field] = data;
  }
}

/* update if not exists */
def updatefs = [ 'mac', 'ip', 'uaString' ];
for (field in updatefs) {
  if ((!ctx._source.containsKey(field) || ctx._source[field] == null) && params.containsKey(field)) {
    ctx._source[field] = params[field];
  }
}

/* createdAt - updatedAt */
if (!ctx._source.containsKey('createdAt')) {
  ctx._source.createdAt = ctx._now;
}
ctx._source.updatedAt = ctx._now;
