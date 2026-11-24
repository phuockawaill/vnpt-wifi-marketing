import _get from 'lodash/get';
import moment from 'moment';
import lodash from 'lodash';
import filterTemplate from './audience-filter.pug';

class AudienceFilter {
  constructor() {
    this.scope = {
      instance: '=?audienceFilter',
    };
    this.template = filterTemplate;
    this.controller = 'AudienceFilterCtrl as vm';
  }

  link(scope) {
    const clearFilter = () => {
      scope.vm.selected = {};
      scope.vm.list = [];
      // scope.vm.matchAllFilter = true;
      delete scope.vm.current;
      delete scope.vm.value;
    };

    const setFilter = (data) => {
      clearFilter();

      let filters = _get(data, '[0]', {});
      let initRule = 'and';

      // scope.vm.matchAllFilter = true;
      // if (Array.isArray(filters.and)) {
      //   filters = filters.and;
      // } else if (Array.isArray(filters.or)) {
      //   filters = filters.or;
      //   scope.vm.matchAllFilter = false;
      // } else {
      //   filters = [];
      // }
      if (Array.isArray(filters.and) && Array.isArray(filters.or)) {
        filters = filters.and.concat(filters.or);
      } else if (Array.isArray(filters.and)) {
        filters = filters.and;
      } else if (Array.isArray(filters.or)) {
        filters = filters.or;
        initRule = 'or';
      } else {
        filters = [];
      }

      filters.forEach((filter) => {
        const currentFilter = scope.vm.filters.find(
          item => item.field === filter.field,
        ) || scope.vm.filters.find(item => item.type === 'custom');

        // let text;
        // if(filter.field === 'range'){
        //     if(filter.value.type === 'datetime'){
        //         text = 'From '+moment(filter.value.scheduleFrom).format('MMM DD')+' -> '+moment(filter.value.scheduleTo).format('MMM DD, YYYY');
        //         if(filter.value.startTime){
        //             text += ' At '+pad(filter.value.startTime)+'h -> '+pad(filter.value.endTime)+'h';
        //         }
        //     } else {
        //         text = 'From '+pad(filter.value.startTime)+'h -> '+pad(filter.value.endTime)+'h everyday';
        //     }
        // } else {
        //     text = filter.value
        //       .map((id) => {
        //         const selectedItem = _get(currentFilter, 'data', []).find(
        //           item => item.id === id,
        //         );
        //         return _get(selectedItem, 'text', id);
        //       })
        //       .join(', ');
        // }

        // scope.vm.selected[filter.field] = {
        //   headerName: _get(currentFilter, 'headerName', filter.field),
        //   text,
        //   value: filter.value,
        // };
        // setCurrentFilter()
        filter.selectOptions = lodash.cloneDeep(scope.vm.selectOptions);
        // if (filter.field === 'frequency' || filter.field === 'visitTime') {
        //   filter.selectOptions.closeOnSelect = true;
        //   filter.selectOptions.multiple = false;
        // }
        // if (Array.isArray(currentFilter.data)) {
        //   filter.selectOptions.data = currentFilter.data;
        // }
        // filter.headerName = _get(currentFilter, 'headerName', filter.field);
        if (!filter.rule) {
          filter.rule = initRule;
        }
        if (currentFilter.type === 'custom') {
          filter.customField = filter.field;
        }
        scope.vm.setCurrentFilter(currentFilter, filter);
      });
      scope.vm.list = filters;
    };
    const getFilter = () => {
      const orArr = [];
      const andArr = [];
      scope.vm.list.forEach(({ rule, field, value }) => {
        // console.log(rule, field, value);
        if (!field || !value) return;
        if (rule === 'and') {
          andArr.push({ field, rule, value: typeof value === 'object' ? value : [value] });
        } else {
          orArr.push({ field, rule, value: typeof value === 'object' ? value : [value] });
        }
      });
      const result = {};
      if (orArr.length) {
        result.or = orArr;
      }
      if (andArr.length) {
        result.and = andArr;
      }
      return [result];
    };

    scope.instance = {
      clearFilter,
      getFilter,
      setFilter,
    };
  }

  static factory($timeout) {
    'ngInject';

    AudienceFilter.instance = new AudienceFilter($timeout);
    return AudienceFilter.instance;
  }
}

class AudienceFilterCtrl {
  constructor(CommonData, User, Campaign, Report, AuthResolver) {
    'ngInject';

    this.genders = [];
    this.ages = [];
    this.incomes = [];
    this.devices = [];
    this.oses = [];
    this.campaigns = [];
    this.websiteCats = [];
    this.filters = [];
    this.objRange = {};
    this.currentUser = AuthResolver.getCurrentUser();

    this.dateOptions = {
      singleDatePicker: true,
      showDropdowns: true,
      timePicker: false,
      locale: { format: 'MMM DD, YYYY' },
    };
    this.timeOptions = [];
    for (let i = 0; i < 24; i += 1) {
      this.timeOptions.push({ text: i, value: i });
    }

    const hasValue = '$$hasValue';
    const noValue = '$$noValue';
    const baseFilterOptions = [
      { id: hasValue, text: 'Has value' },
      { id: noValue, text: 'Has no value' },
    ];
    this.selectOptions = {
      width: '100%',
      containerCssClass: 'select-xs',
      placeholder: 'Chọn giá trị',
      closeOnSelect: false,
      tags: true,
      data: []
    };

    const initFilter = () => {
      const selectBaseFilters = [
        {
          field: 'category',
          headerName: 'Interesting Topic',
          type: 'select',
          data: this.websiteCats.map(item => ({ id: item.value, text: item.text })),
        },
        {
          field: 'frequency',
          headerName: 'Frequency',
          type: 'select',
          data: [
            { id: '2', text: 'Max 2 times' },
            { id: '20', text: 'Max 2 times each Location' },
            { id: '6', text: 'Max 6 times' },
            { id: '60', text: 'Max 6 times each Location' },
            { id: '10', text: 'Max 10 times' },
            { id: '100', text: 'Max 10 times each Location' },
          ],
        },
        {
          field: 'visitTime',
          headerName: 'Visits',
          type: 'select',
          data: [
            { id: '0d', text: 'First Time in day' },
            { id: '1d', text: 'After first Time in day' },
            { id: '0', text: 'First Time' },
            { id: '1', text: 'Second Time' },
            { id: '2', text: 'Third Time' },
            { id: '3', text: 'Fourth Time' },
            { id: '4', text: 'Fifth Time' },
          ],
        },
        {
          field: 'gender',
          headerName: 'Gender',
          type: 'select',
          data: baseFilterOptions.concat(
            this.genders.map(item => ({ id: item.value, text: item.text })),
          ),
        },
        {
          field: 'age',
          headerName: 'Age',
          type: 'select',
          data: baseFilterOptions.concat(
            this.ages.map(item => ({ id: item.value, text: item.text })),
          ),
        },
        {
          field: 'income',
          headerName: 'Income',
          type: 'select',
          data: baseFilterOptions.concat(
            this.incomes.map(item => ({ id: item.value, text: item.text })),
          ),
        },
        {
          field: 'device',
          headerName: 'Device',
          type: 'select',
          data: baseFilterOptions.concat(
            this.devices.map(item => ({ id: item.value, text: item.text })),
          ),
        },
        {
          field: 'os',
          headerName: 'Os',
          type: 'select',
          data: baseFilterOptions.concat(
            this.oses.map(item => ({ id: item.value, text: item.text })),
          ),
        },
        {
          field: 'campaignId',
          headerName: 'Engaged Campaign',
          type: 'select',
          data: baseFilterOptions.concat(
            this.campaigns.map(item => ({ id: item.id, text: item.name })),
          ),
        },
      ];

      this.filters = selectBaseFilters.concat([
        {
          headerName: 'Name',
          field: 'name',
          data: baseFilterOptions.concat([]),
        },
        {
          headerName: 'Phone',
          field: 'phone',
          data: baseFilterOptions.concat([]),
        },
        {
          headerName: 'Email',
          field: 'email',
          data: baseFilterOptions.concat([]),
        },
        {
          headerName: 'Facebook',
          field: 'fb',
          data: baseFilterOptions.concat([]),
        },
        {
          headerName: 'Range',
          field: 'range',
          data: [],
        },
        {
          headerName: 'Voucher',
          field: 'voucher',
          data: baseFilterOptions.concat([]),
        },
        {
          headerName: 'Custom',
          type: 'custom',
          data: baseFilterOptions.concat([]),
        },
      ]);
    };
    Promise.all([
      CommonData.genderCategories(),
      CommonData.ageCategories(),
      CommonData.incomeCategories(),
      CommonData.deviceCategories(),
      CommonData.osCategories(),
      CommonData.websiteCategories(),
      new Promise((resolve) => {
        let query = {};
        if (this.currentUser.profileName === 'admin') {
          return User.find().$promise
            .then((users) => resolve(Campaign.find({ filter: { where: { 'createdBy': { 'inq': users.map(usr => usr.id).concat(this.currentUser.id) } }, fields: { id: 1, name: 1, customFields: 1 } } }).$promise))
        } else {
          if (this.currentUser.profileName !== 'superadmin') {
            query = { where: { 'createdBy': this.currentUser.id }, fields: { id: 1, name: 1, customFields: 1 } };
          }
          resolve(Campaign.find({ filter: query }).$promise);
        }
      })
    ])
      .then(([genders, ages, incomes, devices, oses, websiteCats, campaigns]) => {
        this.genders = genders;
        this.ages = ages;
        this.incomes = incomes;
        this.devices = devices;
        this.oses = oses;
        this.websiteCats = websiteCats;
        this.campaigns = campaigns;

        this.customFieldOptions.data = campaigns.reduce((all, campaign) => {
          if (!Array.isArray(campaign.customFields)) return all;
          return all.concat(
            campaign.customFields.map(item => ({
              text: `${item.displayName} (${campaign.name})`,
              id: `survey.${item.fieldName}`,
            })),
          );
        }, []);
      })
      .finally(() => initFilter());

    // this.matchAllFilter = false;

    this.customFieldOptions = {
      width: '100%',
      placeholder: 'Pick a field',
      tags: true,
      data: [],
    };
    this.selected = {};
    this.list = [];

    this.onCustomFieldChanged = (item) => {
      // console.log('onCustomFieldChanged', item, item.value);
      item.customFieldOptions = lodash.cloneDeep(this.customFieldOptions);
      if (item.customField) {
        Report.get({
          filter: { [item.customField]: hasValue },
          reports: { device: { [item.customField]: 1 } },
        }).$promise.then((data) => {
          const fields = _get(
            data,
            `device['${item.customField}']`,
            [],
          ).map(field => ({
            id: field.name,
            text: field.name,
          }));

          item.selectOptions.data = baseFilterOptions.concat(fields);
        });
        item.field = item.customField;
      } else {
        item.selectOptions.data = baseFilterOptions;
      }
    };
  }

  setCurrentFilter(filter, item) {
    // console.log('setCurrentFilter', filter.field || 'no filter', item.field || 'no item', item.value);
    // let currentField;
    item.type = filter.type;
    item.headerName = filter.headerName;
    if (filter.type === 'custom') {
      // currentField = this.customField;
      item.field = item.customField;
      this.onCustomFieldChanged(item);
    } else {
      // let audienceFilter = $(`.audienceFilter${idx}`);
      // console.log('audienceFilter '+idx, audienceFilter);
      if (filter.field === 'frequency' || filter.field === 'visitTime') {
        item.selectOptions.closeOnSelect = true;
        item.selectOptions.multiple = false;
      } else {
        item.selectOptions.closeOnSelect = false;
        item.selectOptions.multiple = true;
      }
      // currentField = filter.field;
      if (Array.isArray(filter.data)) {
        item.selectOptions.data = filter.data;
      }
      item.field = filter.field;
    }
    // if (filter.field === 'range') {
    //     this.value = _get(this.selected, 'range.value', { type:'time', startTime: 0, endTime: 1, scheduleTo: moment().endOf('month').toDate().toISOString() });
    // } else {
    //     this.value = _get(this.selected, `${currentField}.value`, null);
    // }
    if (filter.field !== item.field) {
      if (filter.field === 'range') {
        item.value = { type: 'time', startTime: 0, endTime: 1, scheduleTo: moment().endOf('month').toDate().toISOString() };
      }
    }
    delete this.selected[item.field];
    this.selected[filter.field] = 1;
  }

  addCurrentFilter() {
    this.list.push({ rule: 'and', field: '', value: {}, selectOptions: lodash.cloneDeep(this.selectOptions) });
    return;
    // const currentField =
    //   filter.type === 'custom' ? this.customField : filter.field;

    // let value = this.value;
    // if (!value) return;
    // if (!Array.isArray(this.value)) {
    //   value = [this.value];
    // }
    // if (!value.length) return;

    // const text = value
    //   .map((id) => {
    //     const selectedItem = filter.data.find(item => item.id === id);
    //     if (!selectedItem) {
    //       filter.data.push({ id, text: id });
    //     }

    //     return _get(selectedItem, 'text', id);
    //   })
    //   .join(', ');
    // const selectedItem = {
    //   headerName: filter.headerName,
    //   text,
    //   value: this.value,
    // };
    // if (filter.type === 'custom') {
    //   selectedItem.headerName = this.customField;
    // }

    // if(currentField === 'range'){
    //     if(selectedItem.value.type === 'datetime'){
    //         selectedItem.text = 'From '+moment(selectedItem.value.scheduleFrom).format('MMM DD')+' -> '+moment(selectedItem.value.scheduleTo).format('MMM DD, YYYY');
    //         if(selectedItem.value.startTime){
    //             selectedItem.text += ' At '+pad(selectedItem.value.startTime)+'h -> '+pad(selectedItem.value.endTime)+'h';
    //         }
    //     } else {
    //         selectedItem.text = 'From '+pad(selectedItem.value.startTime)+'h -> '+pad(selectedItem.value.endTime)+'h everyday';
    //     }
    // }

    // this.selected[currentField] = selectedItem;
  }

  // editFilter(field) {
  //   let filter = this.filters.find(item => item.field === field);
  //   if (!filter && this.selected[field]) {
  //     // customfield
  //     filter = this.filters.find(item => item.type === 'custom');
  //     this.customField = field;
  //   }
  //   this.setCurrentFilter(filter);
  // }

  removeFilter(idx) {
    const currentFilter = this.list[idx] || {};
    delete this.selected[currentFilter.field];
    this.list = [...this.list.slice(0, idx), ...this.list.slice(idx + 1, this.list.length)];
  }

  getMatchFilter(field) {
    return this.filters.filter((item) => !this.selected[item.field] || item.field === field || item.type === 'custom');
  }
}
function pad(d) {
  return (d < 10) ? '0' + d.toString() : d.toString();
}
export default angular
  .module('app.campaign.audience-filter', [])
  .controller('AudienceFilterCtrl', AudienceFilterCtrl)
  .directive('audienceFilter', AudienceFilter.factory);
