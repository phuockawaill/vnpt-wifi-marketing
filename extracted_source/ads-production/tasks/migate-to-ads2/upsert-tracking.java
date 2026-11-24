/* actions - actionType */
def action = ['action': params['actionType'], 'time': ctx._now];
def actions = [];

if (ctx._source.containsKey('actions')) {
  actions = ctx._source.actions;
}

actions.add(action);
ctx._source.actions = actions;

/* meta */
if (!ctx._source.containsKey('meta')) {
  def meta = ['non': 'non'];
  def metafs = [
    'advertiserId', 'publisherId', 'brandId', 'campaignId', 'adUnitId', 'adGroupId', 'campaignCategoryId',
    'ap', 'locationId', 'realLocationId', 'locationCategoryId', 'bannerId', 'cityId'
  ];
  for (field in metafs) {
    if (params.containsKey(field)) {
      meta[field] = params[field];
    }
  }
  meta.remove('non');
  ctx._source.meta = meta;
}

/* audience */
if (!ctx._source.containsKey('audience')) {
  def audience = ['non': 'non'];
  def audiencefs = [
    'os', 'device'
  ];

  for (field in audiencefs) {
    if (params.containsKey(field)) {
      audience[field] = params[field];
    }
  }
  audience.remove('non');
  ctx._source.audience = audience;
}

/* update if not exists */
def updatefs = [ 'mac', 'ip', 'uaString', 'count', 'isNew' ];
for (field in updatefs) {
  if (!ctx._source.containsKey(field) && params.containsKey(field)) {
    ctx._source[field] = params[field];
  }
}

/* createdAt - updatedAt */
if (!ctx._source.containsKey('createdAt')) {
  ctx._source.createdAt = ctx._now;
}
ctx._source.updatedAt = ctx._now;
