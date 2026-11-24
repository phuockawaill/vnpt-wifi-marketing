const moment = require('moment');
const lodash = require('lodash');

module.exports = (Visit) => {
  Visit.disableRemoteMethodByName('exists');
  Visit.disableRemoteMethodByName('create');
  Visit.disableRemoteMethodByName('upsert');
  Visit.disableRemoteMethodByName('updateAll');
  Visit.disableRemoteMethodByName('prototype.patchAttributes');
  Visit.disableRemoteMethodByName('prototype.updateAttributes');
  Visit.disableRemoteMethodByName('replaceOrCreate');
  Visit.disableRemoteMethodByName('replaceById');
  Visit.disableRemoteMethodByName('upsertWithWhere');
  Visit.disableRemoteMethodByName('deleteById');
  Visit.disableRemoteMethodByName('createChangeStream');
  const metaReports = ['campaignId', 'locationId', 'bannerId'];
  const buildFilter = (field, value) => {
    if (value === '$$hasValue') {
      return { exists: { field } };
    }
    return { term: { [field]: value } };
  };
  const parseFilter = (filter) => {
    const query = {
      bool: { filter: [], must_not: [], must: {bool: {should:[]}} },
    };

    if (filter.from) {
      const dFrom = moment(filter.from);
      if (dFrom.isValid()) {
        query.bool.filter.push({
          range: { createdAt: { gte: dFrom.startOf('day').valueOf() } },
        });
      }
    }
    if (filter.to) {
      const dTo = moment(filter.to);
      if (dTo.isValid()) {
        query.bool.filter.push({
          range: { createdAt: { lte: dTo.endOf('day').valueOf() } },
        });
      }
    }

    metaReports.forEach((field) => {
      if (!lodash.isNil(filter[field]) && !lodash.isEmpty(filter[field])) {
          if(lodash.isArray(filter[field])){
              for(let iMeta = 0;iMeta<filter[field].length;iMeta++){
                  query.bool.must.bool.should.push(buildFilter(field, filter[field][iMeta]));
              }
          } else {
              query.bool.filter.push(buildFilter(field, filter[field]));
          }
      }
    });

    Object.keys(filter).forEach((field) => {
      if (field.indexOf('survey.') === 0) {
        query.bool.filter.push(buildFilter(field, filter[field]));
      }
    });

    return query;
  };

  Visit.exportReport = async (filter) =>{
      let convertFilter = { match_all: {} };
      if(filter){
          convertFilter = parseFilter(filter);
      }
      const esCon = Visit.getDataSource().connector;
      const esDb = esCon.db;
      const data = await Promise.promisify(esDb.search).call(esDb, {
        index: esCon.searchIndex,
        type: Visit.modelName,
        body: {
            query: convertFilter,
            size: 0,
            aggs: {
                category: {
                    terms: { field: "subject", "size" : 10 }
                },
                website: {
                    terms: { field: "site", "size" : 10 }
                }
            }
        },
      });
      return getResult(data);
  };

  const getResult = (data) => {
      let result = {total: data.hits.total};
      result.website = data.aggregations.website.buckets.map((item)=>{ return {name: item.key, y: item.doc_count}});
      result.category = data.aggregations.category.buckets.map((item)=>{ return {name: item.key, y: item.doc_count}});
      return result;
  }

  Visit.getMacAgg = async (mac) => {
      const esCon = Visit.getDataSource().connector;
      const esDb = esCon.db;
      const data = await Promise.promisify(esDb.search).call(esDb, {
        index: esCon.searchIndex,
        type: Visit.modelName,
        body: {
            query: {
                match: { mac }
            },
            size: 0,
            aggs: {
                category: {
                    terms: { field: "subject", "size" : 5 }
                },
                website: {
                    terms: { field: "site", "size" : 6 }
                }
            }
        },
      });
      return getResult(data);
  };

  Visit.getMacTopic = async (mac) => {
      const esCon = Visit.getDataSource().connector;
      const esDb = esCon.db;
      const data = await Promise.promisify(esDb.search).call(esDb, {
        index: esCon.searchIndex,
        type: Visit.modelName,
        body: {
            query: {
                match: { mac }
            },
            size: 0,
            aggs: {
                category: {
                    terms: { field: "subject", "size" : 5 }
                }
            }
        }
      });
      let result = "";
      if(data.aggregations.category.buckets.length){
          result = data.aggregations.category.buckets.map((item)=>{return item.key});
      }
      return result;
  };
};
