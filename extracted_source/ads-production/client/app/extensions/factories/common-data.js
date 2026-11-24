class CommonData {
  constructor(SelectOption) {
    this.SelectOption = SelectOption;
    this.config = {};

    const types = [
      'city',
      'location_category',
      'gender_category',
      'age_category',
      'income_category',
      'os_category',
      'device_category',
      'website_category'
    ];
    const offlineData = {};
    types.forEach((type) => {
      offlineData[type] = [];
    });

    // this.loading = true;
    // this.loaded = false;
    // return this.SelectOption
    //   .find({
    //     filter: {
    //       where: { type: types },
    //       fields: { type: 1, text: 1, value: 1, id: 1, options: 1 },
    //     },
    //   })
    //   .$promise.then((data) => {
    //     data.forEach((row) => {
    //       offlineData[row.type].push(row);
    //     });
    //     this.loading = false;
    //     this.loaded = true;
    //   })
    //   .catch(() => {
    //     this.loading = false;
    //   });
  }

  static postProcess(data, isObject, textField, valueField) {
    let result;

    if (isObject) {
      result = {};
      data.forEach((item) => {
        result[item.value] = item.text;
      });
    } else if (textField !== 'text' || valueField !== 'value') {
      result = [];
      data.forEach((item) => {
        const newItem = {};
        newItem[textField] = item.text;
        newItem[valueField] = item.value;
        newItem.id = item.id;
        result.push(newItem);
      });
    } else {
      result = data;
    }

    return Promise.resolve(result);
  }

  getByType(
    type,
    isObject = false,
    textField = 'text',
    valueField = 'value',
    forceReload = false,
  ) {
    const dataKey = `_${type}`;
    if (!forceReload && this[dataKey]) {
      return Promise.resolve(this[dataKey]).then(data =>
        CommonData.postProcess(data, isObject, textField, valueField),
      );
    }

    return this.SelectOption
      .find({
        filter: {
          where: { type },
          fields: { text: 1, value: 1, id: 1, options: 1 },
        },
      })
      .$promise.then((data) => {
        this[dataKey] = data;
        return data;
      })
      .then(data =>
        CommonData.postProcess(data, isObject, textField, valueField),
      );
  }

  cities(isObject, textField, valueField, forceReload) {
    return this.getByType('city', isObject, textField, valueField, forceReload);
  }

  campaignCategories(isObject, textField, valueField, forceReload) {
    return this.getByType(
      'campaign_category',
      isObject,
      textField,
      valueField,
      forceReload,
    );
  }

  locationCategories(isObject, textField, valueField, forceReload) {
    return this.getByType(
      'location_category',
      isObject,
      textField,
      valueField,
      forceReload,
    );
  }

  genderCategories(isObject, textField, valueField) {
    return this.getByType('gender_category', isObject, textField, valueField);
  }

  ageCategories(isObject, textField, valueField) {
    return this.getByType('age_category', isObject, textField, valueField);
  }

  maritalCategories(isObject, textField, valueField) {
    return this.getByType('marital_category', isObject, textField, valueField);
  }

  incomeCategories(isObject, textField, valueField) {
    return this.getByType('income_category', isObject, textField, valueField);
  }

  osCategories(isObject, textField, valueField) {
    return this.getByType('os_category', isObject, textField, valueField);
  }

  deviceCategories(isObject, textField, valueField) {
    return this.getByType('device_category', isObject, textField, valueField);
  }

  websiteCategories(isObject, textField, valueField) {
    return this.getByType('website_category', isObject, textField, valueField);
  }

  interestCategories(isObject, textField, valueField, forceReload) {
    return this.getByType(
      'interest_category',
      isObject,
      textField,
      valueField,
      forceReload,
    );
  }

  purposeCategories(isObject, textField, valueField, forceReload) {
    return this.getByType(
      'purpose_category',
      isObject,
      textField,
      valueField,
      forceReload,
    );
  }

  static factory(SelectOption) {
    'ngInject';

    CommonData.instance = new CommonData(SelectOption);
    return CommonData.instance;
  }
}

export default angular
  .module('app.factory.common-data', [])
  .factory('CommonData', CommonData.factory);
