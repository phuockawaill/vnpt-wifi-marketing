import _findIndex from 'lodash/findIndex';
import _groupBy from 'lodash/groupBy';
import _uniqBy from 'lodash/uniqBy';
import _get from 'lodash/get';
import _merge from 'lodash/merge';
import _reject from 'lodash/reject';
import _zipObject from 'lodash/zipObject';
import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _flatMap from 'lodash/flatMap';
import cellRenderSource from './renderSource';
import gridCellCategoryTemplate from './grid.cell-category.pug';
import gridCellLocationMoveTemplate from './grid.cell-location-move.pug';

let moment;

const hasValue = '$$hasValue';
const noValue = '$$noValue';
const baseFilterOptions = [
  { id: hasValue, text: 'Has value' },
  { id: noValue, text: 'Has no value' }
];
const baseFilterSrcOptions = [
  { id: hasValue, text: 'Has value' },
  { id: noValue, text: 'Has no value' },
  { id: '$$fromFb', text: 'From Facebook' },
  { id: '$$fromGg', text: 'From Google' },
  { id: '$$fromSur', text: 'From Survey' }
];

class CrmCtrl {
  constructor(
    lib,
    $timeout,
    $window,
    $httpParamSerializer,
    LoopBackResource,
    LoopBackAuth,
    Notification,
    Messages,
    Device,
    campaigns,
    ages,
    genders,
    incomes,
    devices,
    oses,
    locations,
    websiteCats,
  ) {
    moment = lib.moment;

    this.$timeout = $timeout;
    this.$window = $window;
    this.$httpParamSerializer = $httpParamSerializer;
    this.LoopBackAuth = LoopBackAuth;
    this.LoopBackResource = LoopBackResource;

    this.Messages = Messages;
    this.Notification = Notification;

    this.Crm = Device;

    this.campaigns = campaigns;

    // Filter categories
    this.ages = ages;
    this.genders = genders;
    this.incomes = incomes;
    this.devices = devices;
    this.oses = oses;
    this.websiteCats = websiteCats;
    this.rowData = {};

    this.locationHash = {};
    locations.forEach((loc) => {
        this.locationHash[loc.id] = loc.name;
    });
    this.viewHeight = window.innerHeight;

    this.initGrid();
    this.initFilter();
    this.initCharts();
  }

  initFilter() {
    this.filters = [];
    this.filter = {
      all: [
        {
          headerName: 'Time',
          field: 'updatedAt',
          filter: 'date'
        },
        {
          headerName: 'Campaign',
          field: 'meta.campaignId',
          filter: 'select',
          selectOptions: this.campaigns.map(item => ({
            id: item.id,
            text: item.name
          }))
        },
        {
          headerName: 'Location',
          field: 'meta.locationId',
          filter: 'select',
          selectOptions: []
        },
        {
          headerName: 'Facebook',
          field: 'fb',
          filter: 'select',
          selectOptions: baseFilterOptions
        },
        {
            headerName: 'Category',
            field: 'mainCategory',
            filter: 'select',
            selectOptions: _map(this.websiteCats, (item, key) => ({
              id: key,
              text: item
          })).concat({ id: 'unknown', text: 'Unknown' })
        }
      ].concat(this.columnDefs.filter(col => col.filter)),
      selectOptions: {
        width: '100%',
        placeholder: 'Pick a value',
        data: []
      }
    };

    this.updateDynamicFilter = (filters) => {
      const allFilters = this.filter.all.filter(item => !item.dynamic);

      this.filter.all = [
        ...filters.map(item => ({
          headerName: item.displayName,
          field: `survey.${item.fieldName}`,
          filter: 'text',
          suppressSorting: true,
          dynamic: true
        })),
        ...allFilters
      ];

      this.updateDynamicGrid(filters);
    };

    this.setCurrentFilter = (filter) => {
      this.filter.current = filter;

      if (filter.field === 'meta.locationId') {
        this.updateLocationList();
      }

      if (filter.filter === 'select') {
        this.filter.selectOptions.data = filter.selectOptions;
      }

      this.filter.value = null;
    };

    this.addCurrentFilter = () => {
      if (!this.filter.current || !this.filter.value) return;
      const isExists = this.filters.find(
        item =>
          item.field === this.filter.current.field &&
          item.value === this.filter.value,
      );

      if (isExists) {
        return;
      }

      const filter = {
        headerName: this.filter.current.headerName,
        field: this.filter.current.field,
        value: this.filter.value
      };

      // Set filter text
      if (this.filter.current.filter === 'select') {
        const option = this.filter.current.selectOptions.find(
          item => item.id === filter.value,
        );
        if (option) {
          filter.text = option.text;
        }
      } else if (this.filter.current.filter === 'date') {
        filter.text = filter.value
          .map(item => moment(item).format('MMM DD, YYYY'))
          .join(' - ');
      }
      filter.text = filter.text || filter.value;

      // Only allow 1 filter for campaign and date
      // if (
      //   ['updatedAt', 'createdAt', 'meta.campaignId'].indexOf(filter.field) > -1
      // ) {
        const index = _findIndex(
          this.filters,
          item => item.field === filter.field,
        );
        if (index > -1) {
          this.filters.splice(index, 1);
        }
      // }
      this.filters.push(filter);

      // Add custom field filters
      // if (filter.field === 'meta.campaignId') {
      //   const campaign = this.campaigns.find(item => item.id === filter.value);
      //   const customFields = _get(campaign, 'customFields', []);
      //   this.updateDynamicFilter(customFields);
      // }

      this.gridApi.onFilterChanged();
    };

    this.removeFilter = (index) => {
      const filter = this.filters[index].field;
      this.filters.splice(index, 1);

      if (filter === 'meta.campaignId') {
        if (this.filter.current.field === 'meta.locationId') {
          this.updateLocationList();
          const locationFilter = this.filter.all.find(
            item => item.field === 'meta.locationId',
          );
          this.filter.selectOptions.data = locationFilter.selectOptions;
        }

        // this.updateDynamicFilter();
      }

      this.gridApi.onFilterChanged();
    };

    this.toggleFilter = (index) => {
      this.filters[index].disabled = !this.filters[index].disabled;

      this.gridApi.onFilterChanged();
    };

    this.updateLocationList = () => {
      const locationFilter = this.filter.all.find(
        item => item.field === 'meta.locationId',
      );
      const campaignFilter = this.filters.find(
        item => item.field === 'meta.campaignId',
      );

      const filterCampaignId = campaignFilter && campaignFilter.value;
      const locations = this.campaigns.reduce((all, campaign) => {
        if (filterCampaignId && campaign.id !== filterCampaignId) {
          return all;
        }

        return all.concat(
          campaign.locations.filter(item => !item.reportLocationId),
        );
      }, []);

      locationFilter.selectOptions = _uniqBy(
        locations,
        'locationId',
      ).map(item => ({ id: item.locationId, text: item.locationName }));
    };
  }

  buildChildFilter(field, value) {
    if (field === 'updatedAt' || field === 'createdAt') {
      const filter = { [field]: {} };
      if (!Array.isArray(value)) {
        value = [value];
      }
      // if (value[0]) {
      //   filter[field].gte = value[0];
      // }
      // if (value[1]) {
      //   filter[field].lte = value[1];
      // }

      return [{ [field]: { gte: value[0] } }, { [field]: { lte: value[1] } }];
    }

    if (Array.isArray(value)) {
      return { [field]: { inq: value } };
    }

    return { [field]: value };
  }

  buildFilters() {
    let filters = _groupBy(
      this.filters.filter(filter => !filter.disabled),
      'field',
    );
    filters = Object.keys(filters).map((field) => {
      if (filters[field].length === 1) {
        return this.buildChildFilter(field, field === 'updatedAt' ? filters[field][0].value : `*${filters[field][0].value}*`);
      }
      return {
        or: filters[field].map(item =>
          this.buildChildFilter(field, `*${item.value}*`),
        )
      };
    });

    return { where: { and: _flatMap(filters) } };
  }

  initGrid() {
    this.gridDatasource = {
      getRows: ({ request, successCallback, failCallback }) => {
        if (request.endRow > 10000) {
          return failCallback();
        }
        const filter = {
          ...this.buildFilters(),
          offset: request.startRow,
          limit: request.endRow - request.startRow
        };

        if (request.sortModel.length) {
          filter.order = request.sortModel.map(
            item => `${item.colId} ${item.sort.toUpperCase()}`,
          );
        }

        return this.Crm
          .findWithTotal({ filter })
          .$promise.then((crmData) => {
            successCallback(crmData.data.map((item) => {
              if (item.fb) item.fb.name = item.fb.fbName;
              return item;
            }), crmData.total);
          })
          .catch(failCallback);
      }
    };

    this.columnDefs = [
      {
        headerName: 'No',
        field: '',
        width: 50,
        // maxWidth: 50,
        suppressSorting: true,
        pinned: 'left',
        cellRenderer: params => params.rowIndex + 1
      },
      {
        headerName: 'Mac',
        field: 'mac',
        width: 170,
        // maxWidth: 170,
        pinned: 'left',
        filter: 'text'
      },
      {
        headerName: 'Name',
        field: 'audience.name',
        width: 200,
        filter: 'select',
        selectOptions: baseFilterSrcOptions,
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Gender',
        field: 'audience.gender',
        width: 200,
        // maxWidth: 100,
        filter: 'select',
        selectOptions: baseFilterSrcOptions.concat(this.genders.map(item => ({
          id: item.value,
          text: item.text
        }))),
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Phone',
        field: 'audience.phone',
        width: 200,
        // maxWidth: 150,
        filter: 'select',
        selectOptions: baseFilterOptions,
        suppressSorting: true,
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Email',
        field: 'audience.email',
        width: 200,
        filter: 'select',
        selectOptions: baseFilterSrcOptions,
        suppressSorting: true,
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Facebook',
        field: 'fb.fbId',
        width: 200,
        // maxWidth: 200,
        // pinned: 'left',
        cellRenderer: (params) => {
          if (params.value) {
            return `<img class="img-circle img-xs"
              src="https://graph.facebook.com/v2.9/${params.value}/picture">
              <a target="_blank"
                href="https://facebook.com/${params.value}">
                ${params.data.fb.fbName}</a>`;
          }
          return '';
        }
      },
      {
          headerName: 'Location Moving',
          width: 180,
          suppressSorting: true,
          template: gridCellLocationMoveTemplate
      },
      {
          headerName: 'Top Interesting',
          width: 200,
          suppressSorting: true,
          template: gridCellCategoryTemplate
      },
      {
        headerName: 'Device',
        field: 'audience',
        width: 150,
        // maxWidth: 65,
        headerClass: 'text-center',
        cellClass: 'text-center',
        cellRenderer: (params) => {
          if (!params.value) {
            return '';
          }
          let os = '';
          switch (params.value.os) {
            case 'ios':
            case 'mac':
              os = '<i class="icon-apple2 text-grey-300"></i>'; break;
            case 'android':
              os = '<i class="icon-android text-green-600"></i>'; break;
            case 'windows':
            case 'windows_phone':
              os = '<i class="icon-windows8 text-indigo-600"></i>'; break;
            case 'linux':
              os = '<i class="icon-tux text-orange-300"></i>'; break;
            case 'chrome_os':
              os = '<i class="icon-chrome text-orange-600"></i>'; break;
            default:
              os = '-';
          }
          let device = '';
          switch (params.value.device) {
            case 'mobile':
              device = '<i class="icon-mobile2"></i>'; break;
            case 'tablet':
              device = '<i class="icon-tablet"></i>'; break;
            case 'pc':
              device = '<i class="icon-laptop"></i>'; break;
            default:
              device = '-';
          }
          return `${device} ${os}`;
        }
      },
      {
        headerName: 'Age',
        field: 'audience.age',
        width: 180,
        // maxWidth: 100,
        filter: 'select',
        selectOptions: baseFilterOptions.concat(this.ages.map(item => ({
          id: item.value,
          text: item.text
        }))),
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Income',
        field: 'audience.income',
        width: 170,
        // maxWidth: 140,
        filter: 'select',
        selectOptions: baseFilterOptions.concat(this.incomes.map(item => ({
          id: item.value,
          text: item.text
        }))),
        cellRenderer: cellRenderSource
      },
      {
        headerName: 'Device',
        field: 'audience.device',
        filter: 'select',
        selectOptions: this.devices.map(item => ({
          id: item.value,
          text: item.text
        })),
        hide: true
      },
      {
        headerName: 'Os',
        field: 'audience.os',
        filter: 'select',
        selectOptions: this.oses.map(item => ({
          id: item.value,
          text: item.text
        })),
        hide: true
      },
      {
        headerName: 'Last session',
        field: 'updatedAt',
        width: 165,
        // maxWidth: 165,
        cellRenderer: params =>
          moment(params.value).format('MMM DD, YYYY HH:mm'),
        sort: 'desc'
      }
    ];

    this.gridOptions = {
      columnDefs: this.columnDefs,
      context: this,
      enableColResize: true,
      // enableFilter: true,
      enableSorting: true,
      suppressCellSelection: true,
      suppressRowClickSelection: true,
      angularCompileRows: true,

      // floatingFilter: true,
      // floatingFiltersHeight: 45,
      rowModelType: 'enterprise',
      // enableServerSideFilter: true,

      // pagination
      pagination: true,
      paginationPageSize: 100,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressContextMenu: true,
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,

      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: this.onGridReady.bind(this),
      onPaginationChanged: (opts) => {
        if (opts.newPage && this.gridApi.paginationGetCurrentPage() > 99) {
          this.gridApi.paginationGoToPage(99);
          this.Notification.warning({ message: 'Use Export instead to view more than 10000 rows!' });
        }
      }
    };

    this.gridOptionsLocMove = {
      columnDefs: [
          {
            headerName: 'No',
            field: '',
            width: 80,
            maxWidth: 80,
            suppressSorting: true,
            pinned: 'left',
            cellRenderer: params => params.rowIndex + 1
          },
          {
            headerName: 'Location',
            field: 'locationName',
            width: 170
          },
          {
            headerName: 'Visits',
            field: 'doc_count',
            width: 100
          },
          {
            headerName: 'First Seen',
            field: 'firstSeen.value',
            width: 170,
            cellRenderer: params => moment(params.value).format('MMM DD, YYYY')
          },
          {
            headerName: 'Last Seen',
            field: 'lastSeen.value',
            width: 170,
            cellRenderer: params => moment(params.value).format('MMM DD, YYYY')
          }
      ],
      context: this,
      enableColResize: true,
      enableSorting: true,
      suppressCellSelection: true,
      suppressRowClickSelection: true,
      angularCompileRows: true,

      // pagination
      pagination: true,
      paginationAutoPageSize: true,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressContextMenu: true,
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,

      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: (ev) => {
        this.gridLocMoveApi = ev.api;
      }
    };

    this.updateDynamicGrid = (columns) => {
      const columnDefs = [...this.columnDefs];
      columnDefs.splice.apply(columnDefs, [
        10,
        0,
        ...columns.map(item => ({
          headerName: item.displayName,
          field: `survey.${item.fieldName}`,
          filter: 'text',
          minWidth: 200,
          cellRenderer: cellRenderSource,
          showCountPoint: item.countPoint || false
        }))
      ]);

      this.gridApi.setColumnDefs(columnDefs);
      // this.gridApi.sizeColumnsToFit();
    };
  }

  onGridReady(event) {
    this.gridApi = event.api;
    // this.gridApi.autoSizeColumns();
    this.gridApi.setEnterpriseDatasource(this.gridDatasource);
    let customFields = [];
    this.campaigns.forEach((campaign) => {
        customFields = customFields.concat(_get(campaign, 'customFields', []));
    });
    this.updateDynamicFilter(_uniqBy(customFields, 'fieldName'));
  }

  initCharts() {
    this.charts = {};
    this.serieChart = {};
    this.setChartType = (chartName, type) => {
      if (!(chartName in this.charts)) return;

      this.charts[chartName].type = type;
      this.charts[chartName].instance.update({
        chart: { type }
      });
    };
    this.toggleChartPercentage = (chartName) => {
      if (!(chartName in this.charts)) return;

      const percentage = !this.charts[chartName].percentage;
      this.charts[chartName].percentage = percentage;
      this.charts[chartName].instance.update({
        plotOptions: {
          areaspline: { stacking: percentage ? 'percent' : null },
          column: { stacking: percentage ? 'percent' : null }
        }
      });
    };

    this.chartInitialized = (chartName, hook) => {
      this.charts[chartName].hook = hook;
      this.charts[chartName].instance = hook.instance;
    };

    // Visit site and category
    let chartName = 'visitSiteData.category';
    this.charts[chartName] = {
      type: 'pie',
      name: 'Top Category',
      dataPath: 'visitSiteData.category',
      chartOptions: _merge({}, require('../dashboard/chart-config-pie'), {
        chart: {
          marginTop: 0,
          marginBottom: 55
        }
      }),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: {}
    };
  }

  onAction(action, row) {
    switch (action) {
      case 'export':
      case 'topCategory':
      case 'locationMoving':
      case 'refresh':
        this[action](row);
        break;
      default:
        break;
    }
  }

  topCategory(row) {
      this.rowData = row;
      this.Crm.macData({ mac: row.mac })
        .$promise
        .then((data) => {
            data.visitSiteData = this.visitSiteDataConvert(data);
            Object.keys(this.charts).forEach((chartName) => {
                if (_get(data, this.charts[chartName].dataPath, []).length) {
                    this.charts[chartName].series = this.serieChart[chartName];
                } else {
                    this.charts[chartName].series = {};
                }
                this.charts[chartName].hook
                    .updateData(_get(data, this.charts[chartName].dataPath, []));
            });
        });
  }

  locationMoving(row) {
      this.rowData = row;
      this.Crm.locationMoving({ mac: row.mac })
        .$promise
        .then((data) => {
          console.log('locationMoving', data);
            let result = [];
            if (data.location) {
                _forEach(data.location, (val, key) => {
                    if (val.doc_count) {
                        val.locationName = this.locationHash[key] || 'Unknown';
                        result.push(val);
                    }
                });
            }
            this.gridLocMoveApi.setRowData(result);
            this.gridLocMoveApi.sizeColumnsToFit();
        });
  }
  visitSiteDataConvert(data) {
      let websiteData = _reject(data.website, i => i.name === 'www');
      this.serieChart['visitSiteData.category'] = _zipObject(
        data.category.map(item => item.name || 'Unknown'),
        data.category.map(item => ({ name: this.websiteCats[item.name] || 'Unknown' })),
      );
      this.serieChart['visitSiteData.website'] = _zipObject(
        websiteData.map(item => item.name),
        websiteData.map(item => ({ name: item.name })),
      );
      return {
          website: [{ name: '', detail: websiteData }],
          category: [{ name: '', detail: data.category.map(item => ({ name: item.name || 'Unknown', y: item.y })) }]
      };
  }

  export() {
    const filter = this.buildFilters();
    const baseUrl = this.LoopBackResource.getUrlBase();
    const exportUrl = '/devices/export';
    const queryString = this.$httpParamSerializer({ filter });
    this.$window.open(
      `${baseUrl}${exportUrl}?access_token=${this.LoopBackAuth
        .accessTokenId}&${queryString}`,
      '_blank',
    );
  }

  refresh() {
    this.gridApi.onFilterChanged();
  }
}

export default angular
  .module('app.crm.controller', [
    'agGrid',
    'app.directive.select2',
    'app.directive.dateRangePicker',
    'app.directive.highchart',
    require('../dashboard/chart-config').name
  ])
  .controller('CrmCtrl', CrmCtrl);
