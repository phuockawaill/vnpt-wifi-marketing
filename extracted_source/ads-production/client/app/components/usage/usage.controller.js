import _merge from 'lodash/merge';
import axios from 'axios';
import _forEach from 'lodash/forEach';
import _size from 'lodash/size';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _uniqBy from 'lodash/uniqBy';
import _uniq from 'lodash/uniq';
import _zipObject from 'lodash/zipObject';
import _findIndex from 'lodash/findIndex';
import _reject from 'lodash/reject';
import cellRenderSource from './renderSource';


const number_format = (number, decimals, dec_point, thousands_sep) => {
  let n = number,
c = isNaN(decimals = Math.abs(decimals)) ? 0 : decimals;
  const d = dec_point == undefined ? '.' : dec_point;
  let t = thousands_sep == undefined ? ',' : thousands_sep,
s = n < 0 ? '-' : '';
  let i = `${parseInt(n = Math.abs(+n || 0).toFixed(c))}`,
j = (j = i.length) > 3 ? j % 3 : 0;

  return s + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${t}`) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
};
let moment;
class UsageCtrl {
  constructor(lib, $timeout, $rootScope, currentUser, CommonData, CommonUtil,
    Report, ReportAudience, ReportTracking, Brand, User, Campaign, Device, banners, locations,
    campaigns, genderCats, ageCats, incomeCats, deviceCats, osCats, websiteCats, shares, PublisherShare) {
    'ngInject';

    moment = lib.moment;

    this.$timeout = $timeout;
    this.$rootScope = $rootScope;

    this.Report = Report;
    this.Brand = Brand;
    this.User = User;
    this.Campaign = Campaign;
    this.CommonData = CommonData;
    this.ReportTracking = ReportTracking;
    this.CommonUtil = CommonUtil;
    this.Device = Device;
    this.ReportAudience = ReportAudience;
    this.PublisherShare = PublisherShare;

    this.currentUser = currentUser;
    this.allCampaigns = campaigns;
    this.genderCats = genderCats;
    this.ageCats = ageCats;
    this.locCats = {};
    this.campCats = {};
    this.banCats = {};
    this.apCats = {};
    this.apDetail = {};
    this.incomeCats = incomeCats;
    this.deviceCats = deviceCats;
    this.osCats = osCats;
    this.websiteCats = websiteCats;
    this.shares = shares;
    this.locations = locations;
    this.shareFlag = shares.length ? shares[0].share : null;
    locations.forEach((item) => {
      this.locCats[item.id.toString()] = item.name;
      if (item.apList) {
        item.apList.forEach((iap) => {
          if (iap.mac) {
            this.apCats[iap.mac] = iap.name;
            this.apDetail[iap.mac] = { name: iap.name, band: '2.4G', locationName: item.name };
          }
          if (iap.mac5) {
            this.apCats[iap.mac5] = iap.name;
            this.apDetail[iap.mac5] = { name: iap.name, band: '5G', locationName: item.name };
          }
          if (iap.macLan) {
            this.apCats[iap.macLan] = iap.name;
            this.apDetail[iap.macLan] = { name: iap.name, band: 'LAN', locationName: item.name };
          }
        });
      }
    });
    campaigns.forEach((item) => {
      this.campCats[item.id.toString()] = item.name;
    });
    banners.forEach((item) => {
      this.banCats[item.id.toString()] = item.name;
    });

    this.obj = {};
    this.filter = { interval: 'day' };
    this.reportsToLoad = {
      tracking: { action: 1, newReturn: 1, macFrequency: 1 },
      device: { os: 1, device: 1, gender: 1, age: 1, income: 1 },
      share: this.shareFlag
    };

    this.initFilter();
    this.initCharts();
    this.visitorData = { hour: 0, day: 0, totalVisitor: 0 };
    this.actionsData = { impression: 0, click: 0, ctrl: 0 };
    this.dspData = { impression: 0, click: 0, ctr: 0, revenue: 0 };
    this.mode = 'desktop';
    this.detailDaily = false;
    this.detailVenue = false;

    this.initGrid();
    this.setMonetizeOut();
    $timeout(() => {
      this.loadDashboard();
    }, 200);
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      this.mode = 'mobile';
      // some code..
    }
    setTimeout(() => {
      $('[data-toggle="popoverCampaign"]').popover({
        trigger: 'hover',
        html: true,
        content: this.$rootScope.isLang === 'VN' ?
        '<b>Impression</b>: số lượt hiển thị nội dung quảng cáo<br>' +
          '<b>Click</b>: số lượt click vào nội dung quảng cáo<br>' +
          '<b>CTR</b> (Click Through Rate) = Tỉ lệ lượt Click/Impression<br>' +
          '<b>Note</b>: CTR càng cao thì hiệu suất chiến dịch càng tốt' :
        '<b>Impression</b>: number of views of  the advertising contents<br>' +
          '<b>Click</b>: number of clicks on the advertising contents<br>' +
          '<b>CTR</b> (Click Through Rate) = Click/Impression<br>' +
          '<b>Note</b>: CTR is higher so then Campaign performance is better'
      });
      $('[data-toggle="popoverSource"]').popover({
        trigger: 'hover',
        content: this.$rootScope.isLang === 'VN' ?
        'Số liệu về tỉ lệ nguồn thông tin người dùng: bao nhiêu người dùng đến từ Facebook, Google, Form, Zalo, Twitter' :
        'Report about percentage of user sources: how much users come from Facebook, Google, Form, Zalo, Twitter'
      });
      $('[data-toggle="topVisitor"]').popover({
        trigger: 'hover'
      });
      $('[data-toggle="popoverFrequency"]').popover({
        trigger: 'hover',
        html: true,
        content: this.$rootScope.isLang === 'VN' ?
        'Số liệu về tần suất xuất hiện ở mỗi địa điểm, mỗi chiến dịch, toàn hệ thống<br>' +
          '[1]: 1 lần truy cập<br>' +
          '[2-5]: 2 đến 5 lần truy cập<br>' +
          '[6-10]: 6 đến 10 lần truy cập<br>' +
          '[10+]: trên 10 lần truy cập' :
        'Report about frequency of visits per location, per campaign, per entire system<br>' +
          '[1]: one visit<br>' +
          '[2-5]: 2 to 5 visits<br>' +
          '[6-10]: 6 to 10 visits<br>' +
          '[10+]: over 10 visits'
      });
      $('[data-toggle="popoverBehaviour"]').popover({
        trigger: 'hover',
        html: true,
        content: this.$rootScope.isLang === 'VN' ?
        '<b>New User</b>: Người dùng lần đầu click thành công vào nội dung quảng cáo<br>' +
          '<b>Return User</b>: Người dùng click nhiều lần trên 1 hoặc nhiều nội dung quảng cáo<br>' +
          '<b>Walkthough User</b>: Người dùng thấy được nội dung quảng cáo nhưng không tương tác click<br>' +
          '<b>Ghi chú</b>: nếu lượng Walkthrough user cao, hãy kiểm tra lại Form code trong HTML code hoặc nên tối ưu nội dung quảng cáo' :
        '<b>New User</b>: first clicked successful on the adversiting content<br>' +
          '<b>Return User</b>: User clicked more times on same or different advertising contents<br>' +
          '<b>Walkthough User</b>: User saw or viewed the advertising content but no any click action<br>' +
          '<b>Note</b>: if Walkthrough user rate is very high, pls double check Form code in HTML or must optimize the advertising content'
      });
    }, 200);
  }

  async setMonetizeOut() {
    const { id, profileName } = this.currentUser;
    if (id && profileName && profileName === 'publisher') {
      if (this.shares && this.shares.length > 0) {
        return;
      }

      try {
        const locationDetail = [];
        // if (this.locations && this.locations.length) {
        //   locationDetail = this.locations.map(item => ({
        //     enable: true,
        //     location: item.id,
        //     value: 30,
        //   }));
        // }
        return await this.PublisherShare.create({ locationDetail, share: true, sharingType: 'all', value: 30 }).$promise;
      } catch (error) {
        console.log(error);
      }
    }
  }

  initGrid() {
    this.gridOptions = {
      columnDefs: [
        { headerName: this.$rootScope.isLang === 'VN' ? 'Thời gian' : 'Range', field: 'time', minWidth: 100, width: 131 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Địa điểm' : 'Location', field: 'name', minWidth: 100, maxWidth: 180 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Tổng số thiết bị' : 'Total Devices', field: 'totalDevice', minWidth: 100, width: 127, cellClass: 'text-right' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Thời gian truy cập trung bình' : 'Average duration', field: 'avgTime', minWidth: 80, width: 150, cellClass: 'text-right' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Tỉ lệ dùng trên 180 phút' : 'Over 180 mins', field: 'rateOver180', minWidth: 50, width: 134, cellClass: 'text-right' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Duration cao nhất' : 'Max duration', field: 'maxDuration', minWidth: 60, width: 125, cellClass: 'text-right' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Những ngày có duration cao nhất' : 'Max duration days', field: 'maxDays', minWidth: 60, width: 160, cellClass: 'text-right' },
      ],
      context: this,
      enableColResize: true,
      angularCompileRows: true,
      enableSorting: true,
      enableFilter: true,

      // pagination
      pagination: false,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressContextMenu: true,
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,
      // getContextMenuItems: () => ([
      //   {
      //     name: this.$rootScope.isLang === 'VN' ? 'Xuất file Excel' : 'Excel Export',
      //     action: this.exportData.bind(this, 'excel'),
      //     icon: '<i class="fa fa-file-excel-o" style="margin: 3px;"></i>'
      //   }, {
      //     name: this.$rootScope.isLang === 'VN' ? 'Xuất file CSV' : 'CSV Export',
      //     action: this.exportData.bind(this, 'csv'),
      //     icon: '<i class="fa fa-table" style="margin: 3px;"></i>'
      //   }
      // ]),
      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: this.onGridReady.bind(this)
    };

    this.gridDatasource = {
      getRows: ({ request, successCallback, failCallback }) => {
        console.log('request', request);
        const filter = {
          skip: request.startRow,
          limit: request.endRow - request.startRow
        };

        // if (request.sortModel.length) {
        //   filter.order = request.sortModel.map(
        //     item => `${item.colId} ${item.sort.toUpperCase()}`,
        //   );
        // }
        console.log('this.filter', this.filter);
        const query = {
          createdAt: {
            $gte: moment(this.filter.from).valueOf(),
            $lte: moment(this.filter.to).valueOf(),
          }
        };
        if (this.currentUser.profileName !== 'superadmin') {
          query.campaign = {
            $in: this.campaigns.map(item => item.id.toString())
          };
        }
        if (this.filter.campaignId) {
          query.campaign = this.filter.campaignId;
        }
        if (this.filter.locationId) {
          delete query.campaign;
          query.location = this.filter.locationId;
        }

        return axios.post(`${location.origin}/report_usage`, { query, ...filter })
          .then(({ data }) => {
            successCallback(data.data, data.total);
          })
          .catch(failCallback);
      }
    };

    this.gridOptionsDetail = {
      columnDefs: [
        {
          headerName: 'No',
          field: '',
          width: 70,
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
          filter: 'text',
          suppressSorting: true,
          cellRenderer: params => params.value.toUpperCase()
        },
        {
          headerName: 'Name',
          field: 'name',
          width: 200,
          suppressSorting: true,
          cellRenderer: cellRenderSource
        },
        {
          headerName: 'Phone',
          field: 'phone',
          width: 200,
          suppressSorting: true,
          cellRenderer: cellRenderSource
        },
        {
          headerName: 'Email',
          field: 'email',
          width: 200,
          suppressSorting: true,
          cellRenderer: cellRenderSource
        },
        {
          headerName: 'Device',
          field: 'device',
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
          headerName: 'Campaign',
          field: 'campaign',
          width: 200,
          suppressSorting: true,
          cellRenderer: params => this.campCats[params.value]
        },
        {
          headerName: 'Location',
          field: 'location',
          width: 200,
          suppressSorting: true,
          cellRenderer: params => this.locCats[params.value]
        },
        {
          headerName: 'Start Time',
          field: 'start',
          width: 170,
          suppressSorting: true,
          cellRenderer: params =>
            moment(params.value).format('MMM DD, YYYY HH:mm')
        },
        {
          headerName: 'End Time',
          field: 'end',
          width: 170,
          suppressSorting: true,
          cellRenderer: params =>
            moment(params.value).format('MMM DD, YYYY HH:mm')
        },
        {
          headerName: 'Duration',
          field: 'duration',
          width: 140,
          suppressSorting: true,
          cellRenderer: params => fancyTimeFormat(params.value)
        },
        {
          headerName: 'Device',
          field: 'device.device',
          filter: 'select',
          hide: true
        },
        {
          headerName: 'Os',
          field: 'device.os',
          filter: 'select',
          hide: true
        }
      ],
      context: this,
      enableColResize: true,
      // enableFilter: true,
      enableSorting: false,
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
      onGridReady: this.onGridReadyDetail.bind(this)
    };
  }

  onGridReadyDetail(event) {
    this.gridApiDetail = event.api;
    this.gridApiDetail.setEnterpriseDatasource(this.gridDatasource);
    // this.onGridData();
  }

  onGridReady(event) {
    this.gridApiAnalytic = event.api;
    // this.onGridData();
  }
  exportData(type) {
    if (type === 'excel') {
      this.gridApiAnalytic.exportDataAsExcel({
        fileName: 'UserDetail_AP.xls'
      });
    } else {
      this.gridApiAnalytic.exportDataAsCsv({
        fileName: 'UserDetail_AP.csv'
      });
    }
  }

  initFilter() {
    this.overall = { totalClick: 0, totalImpression: 0, totalCtr: 0 };

    // Filter
    const startDate = moment().subtract(29, 'days').startOf('day');
    const endDate = moment().endOf('day');
    this.filter.from = startDate.toISOString();
    this.filter.to = endDate.toISOString();
    this.onReportDateChanged = () => {
      this.updateCampaignList();
      this.onFilterChanged();
    };

    this.selectCampaignOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn chiến dịch' : 'Pick a campaign',
      allowClear: true,
      data: []
    };
    this.updateCampaignList = () => {
      const dFrom = new Date(this.filter.from);
      const dTo = new Date(this.filter.to);

      this.campaigns = this.allCampaigns.filter(campaign => (
        new Date(campaign.scheduleTo) > dFrom
        && new Date(campaign.scheduleFrom) < dTo));

      this.onCampaignListChanged();
    };
    this.onCampaignListChanged = () => {
      this.selectCampaignOptions.data = this.campaigns.map(item => ({ id: item.id, text: item.name }));

      if (this.filter.campaignId) {
        const index = _findIndex(this.selectCampaignOptions.data, item => item.id === this.filter.campaignId);
        if (index < 0) {
          delete this.filter.campaignId;
        }
      }

      this.updateLocationList();
    };
    this.onCampaignChanged = (newVal, oldVal) => {
      if (newVal || oldVal) {
        this.updateLocationList();
        this.onFilterChanged();
      }
    };

    this.selectLocationOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn địa điểm' : 'Pick a location',
      allowClear: true,
      data: []
    };
    this.selectBannerOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn Creative Ads' : 'Pick a Creative Ads',
      allowClear: true,
      data: []
    };
    this.updateLocationList = () => {
      const locations = this.campaigns.reduce((all, campaign) => {
        if (this.filter.campaignId && campaign.id !== this.filter.campaignId) {
          return all;
        }

        return all.concat(campaign.locations.filter(item => !item.reportLocationId));
      }, []);
      this.selectLocationOptions.data = _uniqBy(locations, 'locationId')
        .map(item => ({ id: item.locationId, text: item.locationName }));

      if (this.filter.locationId) {
        const index = _findIndex(this.selectLocationOptions.data, item => item.id === this.filter.locationId);
        if (index < 0) {
          delete this.filter.locationId;
        }
      }

      // also update bannerList
      const banners = this.campaigns.reduce((all, campaign) => {
        if (this.filter.campaignId && campaign.id !== this.filter.campaignId) {
          return all;
        }
        return all.concat({ bannerId: campaign.bannerDefaultId, bannerName: campaign.bannerDefaultName }).concat(campaign.banners ? campaign.banners : []);
      }, []);
      this.selectBannerOptions.data = _uniqBy(banners, 'bannerId')
        .map(item => ({ id: item.bannerId, text: item.bannerName }));

      if (this.filter.locationId) {
        const index = _findIndex(this.selectBannerOptions.data, item => item.id === this.filter.bannerId);
        if (index < 0) {
          delete this.filter.bannerId;
        }
      }
    };
    this.onLocationChanged = (newVal, oldVal) => {
      if (newVal || oldVal) {
        this.onFilterChanged();
      }
    };

    this.updateCampaignList();
    this.filterDateOptions = { startDate, endDate, parentEl: '.dashboard_filter' };

    this.onFilterChanged = () => {
      this.loadDashboard();
      this.gridApiDetail.onFilterChanged();
    };
  }

  initCharts() {
    this.charts = {};
    this.setChartType = (chartName, type) => {
      if (!(chartName in this.charts)) return;

      this.charts[chartName].type = type;
      this.charts[chartName].instance.update({
        chart: { type }
      });
    };

    this.chartInitialized = (chartName, hook) => {
      this.charts[chartName].hook = hook;
      this.charts[chartName].instance = hook.instance;
    };

    // Action: Impression - Click
    let chartName = 'tracking.action';
    this.charts[chartName] = {
      type: 'column',
      dataPath: 'tracking.action',
      chartOptions: require('./chart-config-location'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: {
        custom: { name: 'Minutes', colorByPoint: true }
        // impression: { name: 'Impression', color: '#62a8ea' },
        // click: { name: 'Click', color: '#46be8a' },
        // impressionLine: { type: 'spline', name: 'Impression Line', color: '#62a8ea', showInLegend: false },
        // clickLine: { type: 'spline', name: 'Click Line', color: '#46be8a', showInLegend: false },
        // ctr: { type: 'spline', name: 'CTR', color: '#f2a654', yAxis: 1 }
      }
    };
  }

  async loadDashboard() {
    const data = await this.Report
      .get({ filter: this.filter, reports: this.reportsToLoad })
      .$promise;

    // query analytics
    const query = {
      createdAt: {
        $gte: moment(this.filter.from).valueOf(),
        $lte: moment(this.filter.to).valueOf(),
      }
    };
    if (this.currentUser.profileName !== 'superadmin') {
      query.campaign = {
        $in: this.campaigns.map(item => item.id.toString())
      };
    }
    if (this.filter.campaignId) {
      query.campaign = this.filter.campaignId;
    }
    if (this.filter.locationId) {
      delete query.campaign;
      query.location = this.filter.locationId;
    }
    const dataAnalytics = await axios.post(`${location.origin}/report_usage_analytic`, { query });

    convertAnalyticData(dataAnalytics.data.weeks, this.locCats, this.gridApiAnalytic);
    this.charts['tracking.action'].hook.updateData(
      Object.keys(dataAnalytics.data.locations).map(key => ({
        name: this.locCats[key],
        detail: [{ name: 'custom', y: Math.floor(dataAnalytics.data.locations[key].avgTime / 60), color: '#3583CA' }]
      }))
    );
    // Others
    // let dataChart;
    // Object.keys(this.charts).forEach((chartName) => {
    //   console.log('chartName', chartName);
    //     dataChart = _get(data, this.charts[chartName].dataPath, []);
    //   console.log('dataChart', chartName, dataChart);
    //     if (this.charts[chartName].hook) {
    //       this.charts[chartName].hook.updateData(dataChart);
    //     }
    // });

    this.actionsData = { impression: 0, click: 0, ctrl: 0 };
    // animateValue('impression', 0, 0, 1);
    // animateValue('click', 0, 0, 1);
    this.$timeout(() => {
      // show user total
      this.visitorData = data.visitorData;
      _forEach(data.visitorData, (val, key) => {
        animateValue(key, 0, val, 500);
      });
      // show actions
      data.tracking.actions.forEach((item) => {
        this.actionsData[item.key] = item.doc_count;
        animateValue(item.key, 0, item.doc_count, 500);
      });
      this.actionsData.ctr = (this.actionsData.click / this.actionsData.impression) * 100;
      // animateValue('ctr', 0, this.actionsData.ctr || 0, 500, '%');
    }, 200);
  }

  refresh() {
    this.onFilterChanged();
  }

  exportChart() {
    // window.print();
    window.html2canvas(document.getElementById('report-chart')).then((canvas) => {
        let data = canvas.toDataURL();
        let docDefinition = {
            info: {
              title: 'Wireless - Time Connect Report',
            },
            content: [{
              text: 'Wireless - Time Connect Report',
              align: 'center'
            }, {
              text: ' ',
              align: 'center'
            }, {
                image: data,
                width: 530,
                align: 'center',
                valign: 'center'
            }]
        };
        window.pdfMake.createPdf(docDefinition).download('Report-Usage.pdf');
    });
  }
}
const convertAnalyticData = (data, locCats, api) => {
  const dataList = [];
  _forEach(data, (week) => {
    if (_size(week.locations)) {
      _forEach(week.locations, (loc, key) => {
        dataList.push({
          ...loc,
          time: `${moment(week.start).format('DD/MM')} - ${moment(week.end).format('DD/MM')}`,
          name: locCats[key],
          avgTime: `${Math.floor(loc.avgTime / 60)} mins`,
          maxDuration: `${Math.floor(loc.maxDuration / 60)} mins`,
          rateOver180: `${loc.overTime ? Math.round((loc.overTime / loc.totalSession) * 100) : 0} %`,
          maxDays: _uniq(loc.maxDays)
        });
      });
    } else {
      // dataList.push({
      //   time: `${moment(item.start).format('DD/MM')} - ${moment(item.end).format('DD/MM')}`,
      // });
    }
  });
  api.setRowData(dataList);
  api.sizeColumnsToFit();
};
const animateValue = (id, start, end, duration, subStr = '') => {
  // assumes integer values for start and end
  const obj = document.getElementById(id);
  if (!obj) return;
  const range = end - start;
  // no timer shorter than 50ms (not really visible any way)
  const minTimer = 50;
  // calc step time to show all interediate values
  let stepTime = Math.abs(Math.floor(duration / range));
  // never go below minTimer
  stepTime = Math.max(stepTime, minTimer);
  // get current time and calculate desired end time
  const startTime = new Date().getTime();
  const endTime = startTime + duration;
  let timer;
  function run() {
    const now = new Date().getTime();
    const remaining = Math.max((endTime - now) / duration, 0);
    const value = Math.round(end - (remaining * range));
    obj.innerHTML = value + subStr;
    if (value === end) {
      clearInterval(timer);
    } else if (end - value < 1) {
      obj.innerHTML = end.toFixed(1) + subStr;
      clearInterval(timer);
    }
  }
  timer = setInterval(run, stepTime);
  run();
};

const fancyTimeFormat = (duration) => {
    // Hours, minutes and seconds
    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = '';

    if (hrs > 0) {
      ret += `${hrs}h `;
    }

    ret += `${mins < 10 ? '0' : ''}${mins}m `;
    ret += `${secs < 10 ? '0' : ''}${secs} sec`;
    return ret;
};

export default angular
  .module('app.dashboard.controller', [
    'agGrid',
    'app.directive.dateRangePicker',
    'app.directive.select2',
    'app.directive.highchart',
    require('./chart-config').name
  ])
  .controller('UsageCtrl', UsageCtrl);

