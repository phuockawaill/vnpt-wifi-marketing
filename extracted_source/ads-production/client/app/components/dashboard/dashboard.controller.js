import _merge from 'lodash/merge';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _uniqBy from 'lodash/uniqBy';
import _zipObject from 'lodash/zipObject';
import _findIndex from 'lodash/findIndex';
import _reject from 'lodash/reject';

const quality = {
  "1": "Rất không hài lòng",
  "2": "Không hài lòng",
  "3": "Bình thường",
  "4": "Hài lòng",
  "5": "Rất hài lòng",
};
const number_format = (number, decimals, dec_point, thousands_sep) => {
  let n = number, c = isNaN(decimals = Math.abs(decimals)) ? 0 : decimals;
  let d = dec_point == undefined ? "." : dec_point;
  let t = thousands_sep == undefined ? "," : thousands_sep, s = n < 0 ? "-" : "";
  let i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;

  return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}
let moment;
class DashboardCtrl {
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
    this.detailUser = false;
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
        let locationDetail = [];
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
        return;
      }
    }
  }

  toogleDetail() {
    this.detailUser = !this.detailUser;
    if (this.detailUser) {
      setTimeout(() => {
        this.gridApiUser.sizeColumnsToFit();
      }, 500);
    }
  }

  toogleDaily() {
    this.detailDaily = !this.detailDaily;
    if (this.detailDaily) {
      setTimeout(() => {
        this.gridApiDaily.sizeColumnsToFit();
      }, 500);
    }
  }

  toogleVenue() {
    this.detailVenue = !this.detailVenue;
    if (this.detailVenue) {
      setTimeout(() => {
        this.gridApiVenue.sizeColumnsToFit();
      }, 500);
    }
  }

  initGrid() {
    this.gridOptions = {
      columnDefs: [
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
          field: '',
          maxWidth: 70,
          suppressSorting: true,
          cellRenderer: params => params.rowIndex + 1,
        },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Địa điểm' : 'Location', field: 'locationName', minWidth: 100 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Tên AP' : 'AP Name', field: 'name', minWidth: 100 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Địa chỉ MAC AP' : 'AP Mac', field: 'mac', minWidth: 100 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Băng tần' : 'Band', field: 'band', minWidth: 50, maxWidth: 80, cellClass: 'text-center' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Giờ hiện tại' : 'Current Hour', field: 'hour', minWidth: 50, cellClass: 'text-center' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Trong ngày' : 'Today', field: 'today', minWidth: 60, sort: 'desc', cellClass: 'text-center' },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Tổng cộng' : 'Total', field: 'total', minWidth: 60, cellClass: 'text-center' },
      ],
      context: this,
      enableColResize: true,
      angularCompileRows: true,
      enableSorting: true,
      enableFilter: true,

      // pagination
      pagination: true,
      paginationPageSize: 50,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,
      getContextMenuItems: () => ([
        {
          name: this.$rootScope.isLang === 'VN' ? 'Xuất file Excel' : 'Excel Export',
          action: this.exportData.bind(this, 'excel'),
          icon: '<i class="fa fa-file-excel-o" style="margin: 3px;"></i>'
        }, {
          name: this.$rootScope.isLang === 'VN' ? 'Xuất file CSV' : 'CSV Export',
          action: this.exportData.bind(this, 'csv'),
          icon: '<i class="fa fa-table" style="margin: 3px;"></i>'
        }
      ]),
      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: this.onGridReady.bind(this)
    };

    this.gridOptionsDailyDSP = {
      columnDefs: [
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Ngày' : 'Date', field: 'day', minWidth: 100,
          cellRenderer: params => moment(Number(params.value)).format('DD/MM/YYYY'),
          cellStyle: () => ({ textAlign: 'center' })
        },
        {
          headerName: 'Impression', field: 'impression', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'Click', field: 'click', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'CTR', field: '', minWidth: 100,
          cellRenderer: params => {
            if (!params.data.click) {
              return '0%';
            }
            return `${(params.data.click / params.data.impression) * 100}%`;
          },
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'Request', field: 'total', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Doanh thu' : 'Revenue', field: 'revenue', minWidth: 100,
          cellRenderer: params => `₫${number_format(params.value)}`,
          cellStyle: () => ({ textAlign: 'right' })
        }
      ],
      context: this,
      enableColResize: true,
      angularCompileRows: true,
      enableSorting: true,
      enableFilter: true,

      // pagination
      pagination: true,
      paginationPageSize: 10,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,
      getContextMenuItems: () => null,

      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: this.onGridReadyDaily.bind(this)
    };

    this.gridOptionsVenueDSP = {
      columnDefs: [
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Địa điểm' : 'Location', field: 'locationId', minWidth: 100,
          cellRenderer: params => this.locCats[params.value] || 'Unknown',
          cellStyle: () => ({ textAlign: 'center' })
        },
        {
          headerName: 'Impression', field: 'impression', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'Click', field: 'click', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'CTR', field: '', minWidth: 100,
          cellRenderer: params => {
            if (!params.data.click) {
              return '0%';
            }
            return `${(params.data.click / params.data.impression) * 100}%`;
          },
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: 'Request', field: 'total', minWidth: 100,
          cellRenderer: params => number_format(params.value),
          cellStyle: () => ({ textAlign: 'right' })
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Doanh thu' : 'Revenue', field: 'revenue', minWidth: 100,
          cellRenderer: params => `₫${number_format(params.value)}`,
          cellStyle: () => ({ textAlign: 'right' })
        }
      ],
      context: this,
      enableColResize: true,
      angularCompileRows: true,
      enableSorting: true,
      enableFilter: true,

      // pagination
      pagination: true,
      paginationPageSize: 10,

      animateRows: true,
      rowHeight: 40,
      headerHeight: 45,

      // hide all menus
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,
      getContextMenuItems: () => null,

      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>'
      },
      onGridReady: this.onGridReadyVenue.bind(this)
    };
  }

  onGridReadyDaily(event) {
    this.gridApiDaily = event.api;
    // this.onGridData();
  }

  onGridReadyVenue(event) {
    this.gridApiVenue = event.api;
    // this.onGridData();
  }

  onGridReady(event) {
    this.gridApiUser = event.api;
    // this.onGridData();
  }
  exportData(type) {
    if (type === 'excel') {
      this.gridApiUser.exportDataAsExcel({
        fileName: 'UserDetail_AP.xls'
      });
    } else {
      this.gridApiUser.exportDataAsCsv({
        fileName: 'UserDetail_AP.csv'
      });
    }
  }

  initFilter() {
    this.overall = { totalClick: 0, totalImpression: 0, totalCtr: 0 };

    // Filter
    const startDate = moment().subtract(1, 'weeks').add(1, 'day').startOf('day');
    const endDate = moment().endOf('day');
    // const startDate = moment().subtract(4, 'month').startOf('day');
    // const endDate = moment().subtract(3, 'month').endOf('day');
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
        this.updateCustomCharts();
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
    };
  }

  initCharts() {
    this.charts = {};
    this.serieChart = {};
    this.setChartType = (chartName, type) => {
      if (!(chartName in this.charts)) return;

      this.charts[chartName].type = type;
      this.charts[chartName].instance.update({
        chart: { type },
      });
    };
    this.toggleChartPercentage = (chartName) => {
      if (!(chartName in this.charts)) return;

      const percentage = !this.charts[chartName].percentage;
      this.charts[chartName].percentage = percentage;
      this.charts[chartName].instance.update({
        plotOptions: {
          areaspline: { stacking: percentage ? 'percent' : null },
          column: { stacking: percentage ? 'percent' : null },
        },
      });
    };

    this.chartInitialized = (chartName, hook) => {
      this.charts[chartName].hook = hook;
      this.charts[chartName].instance = hook.instance;
    };

    this.updateCustomCharts = () => {
      const campaign = this.filter.campaignId &&
        this.campaigns.find(item => item.id === this.filter.campaignId);
      const customFields = _get(campaign, 'customFields', []);

      // Remove old charts
      Object.keys(this.charts).forEach((chartName) => {
        if (this.charts[chartName].dynamic) {
          delete this.charts[chartName];
          delete this.reportsToLoad.device[chartName];
        }
      });

      customFields.forEach((field) => {
        const fieldName = `survey.${field.fieldName}`;
        this.reportsToLoad.device[fieldName] = 1;
        this.charts[fieldName] = {
          type: 'pie',
          name: field.displayName,
          dataPath: `device["${fieldName}"]`,
          chartOptions: require('./chart-config-pie'),
          onInitialized: this.chartInitialized.bind(this, fieldName),
          dynamic: true,
          showCountPoint: field.countPoint || false,
        };

        // this.charts[`${fieldName}-detail`] = {
        //   type: 'column',
        //   name: field.displayName,
        //   dataPath: `device["${fieldName}"]`,
        //   chartOptions: require('./chart-config-custom'),
        //   onInitialized: this.chartInitialized.bind(this, `${fieldName}-detail`),
        //   dynamic: true,
        // };
      });

      this.loadDashboard();
    };

    // Action: Impression - Click
    let chartName = 'tracking.action';
    this.charts[chartName] = {
      type: 'column',
      dataPath: 'tracking.action',
      chartOptions: require('./chart-config-action'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: {
        impression: { name: 'Impression', color: '#62a8ea' },
        click: { name: 'Click', color: '#46be8a' },
        impressionLine: { type: 'spline', name: 'Impression Line', color: '#62a8ea', showInLegend: false },
        clickLine: { type: 'spline', name: 'Click Line', color: '#46be8a', showInLegend: false },
        ctr: { type: 'spline', name: 'CTR', color: '#f2a654', yAxis: 1 },
      },
    };

    chartName = 'tracking.newReturn';
    this.charts[chartName] = {
      type: 'column',
      dataPath: 'tracking.newReturn',
      chartOptions: require('./chart-config-detail'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: {
        New: { name: 'New User', color: '#62a8ea' },
        Return: { name: 'Return User', color: '#46be8a' },
        Walkthrough: { name: 'Walkthrough User', color: '#ff0000' },
      },
    };
    chartName = 'tracking.newReturn-sum';
    this.serieChart[chartName] = {
      New: { name: 'New User' },
      Return: { name: 'Return User' },
      Walkthrough: { name: 'Walkthrough User' },
    };
    this.charts[chartName] = {
      type: 'pie',
      name: 'Behaviour',
      dataPath: 'tracking.newReturn-sum',
      chartOptions: { colors: ['#62a8ea', '#46be8a', '#ff0000'], ...require('./chart-config-pie') },
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: this.serieChart[chartName],
    };

    chartName = 'tracking.macFrequency';
    this.serieChart[chartName] = {
      1: { name: '1' },
      '2-5': { name: '2-5' },
      '6-10': { name: '6-10' },
      '10+': { name: '10+' }
    };
    this.charts[chartName] = {
      type: 'bar',
      dataPath: 'tracking.macFrequency',
      chartOptions: require('./chart-config-frequency'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: this.serieChart[chartName],
    };

    chartName = 'tracking.macFrequency-pie';
    this.serieChart[chartName] = this.serieChart['tracking.macFrequency'];
    this.charts[chartName] = {
      type: 'pie',
      name: 'Frequency',
      dataPath: 'tracking.macFrequency',
      chartOptions: require('./chart-config-pie'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: this.serieChart[chartName],
    };

    chartName = 'tracking.topBanner';
    this.charts[chartName] = {
      type: 'pie',
      dataPath: 'tracking.topBanner',
      chartOptions: require('./chart-config-pie'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: [],
    };

    chartName = 'tracking.topVisitor';
    this.charts[chartName] = {
      type: 'pie',
      dataPath: 'tracking.topVisitor',
      chartOptions: require('./chart-config-pie'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: [],
    };

    chartName = 'device.source';
    this.serieChart[chartName] = {
      'Form': { name: 'Form' },
      'Facebook': { name: 'Facebook' },
      'Google': { name: 'Google' },
      'Zalo': { name: 'Zalo' },
      'Twitter': { name: 'Twitter' },
    };
    this.charts[chartName] = {
      type: 'pie',
      name: 'Source',
      dataPath: 'device.source',
      chartOptions: require('./chart-config-pie'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    let colors = ['#3583CA', '#F978A6', '#A3AFB7'];
    chartName = 'device.gender';
    const genderSeries = _zipObject(
      Object.keys(this.genderCats),
      Object.keys(this.genderCats)
        .map((key, i) => ({ name: this.genderCats[key], color: colors[i] })),
    );
    this.serieChart[chartName] = genderSeries;
    this.charts[chartName] = {
      type: 'pie',
      name: 'Gender',
      dataPath: 'device.gender',
      chartOptions: { colors, ...require('./chart-config-pie') },
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    chartName = 'device.gender-detail';
    this.charts[chartName] = {
      type: 'column',
      name: 'Gender Detail',
      dataPath: 'device.gender',
      chartOptions: require('./chart-config-detail'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: genderSeries,
    };

    colors = ['#A2CAEE', '#62A8EA', '#3583CA', '#677AE4', '#465BD4', '#A3AFB7'];
    chartName = 'device.age';
    const ageSeries = _zipObject(
      Object.keys(this.ageCats),
      Object.keys(this.ageCats)
        .map((key, i) => ({ name: this.ageCats[key], color: colors[i] })),
    );
    this.serieChart[chartName] = ageSeries;
    this.charts[chartName] = {
      type: 'pie',
      name: 'Age',
      dataPath: 'device.age',
      chartOptions: { colors, ...require('./chart-config-pie') },
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    chartName = 'device.age-detail';
    this.charts[chartName] = {
      type: 'column',
      name: 'Age',
      dataPath: 'device.age',
      chartOptions: require('./chart-config-detail'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      percentage: false,
      series: ageSeries,
    };

    colors = ['#FBCE9D', '#F4B066', '#E98F2E', '#FA7A7A', '#D6494B', '#A3AFB7'];
    chartName = 'device.income';
    const incomeSeries = _zipObject(
      Object.keys(this.incomeCats),
      Object.keys(this.incomeCats)
        .map((key, i) => ({ name: this.incomeCats[key], color: colors[i] })),
    );

    this.serieChart[chartName] = incomeSeries;

    this.charts[chartName] = {
      type: 'pie',
      name: 'Income',
      dataPath: 'device.income',
      chartOptions: { colors, ...require('./chart-config-pie') },
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    chartName = 'device.income-detail';
    this.charts[chartName] = {
      type: 'column',
      dataPath: 'device.income',
      chartOptions: require('./chart-config-detail'),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: incomeSeries,
    };

    chartName = 'device.os';
    this.serieChart[chartName] = _zipObject(
      Object.keys(this.osCats),
      Object.keys(this.osCats).map(key => ({ name: this.osCats[key] })),
    );
    this.charts[chartName] = {
      type: 'pie',
      name: 'OS',
      dataPath: 'device.os',
      chartOptions: _merge({}, require('./chart-config-pie'), {
        chart: {
          marginTop: 0,
          marginBottom: 55,
        },
      }),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    chartName = 'device.device';
    this.serieChart[chartName] = _zipObject(
      Object.keys(this.deviceCats),
      Object.keys(this.deviceCats).map(key => ({ name: this.deviceCats[key] })),
    );
    this.charts[chartName] = {
      type: 'pie',
      name: 'Device Type',
      dataPath: 'device.device',
      chartOptions: _merge({}, require('./chart-config-pie'), {
        chart: {
          marginTop: 0,
          marginBottom: 55,
        },
      }),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: this.serieChart[chartName],
    };

    // Visit site and category
    chartName = 'visitSiteData.category';
    this.charts[chartName] = {
      type: 'pie',
      name: 'Top Interesting Topic',
      dataPath: 'visitSiteData.category',
      chartOptions: _merge({}, require('./chart-config-pie'), {
        chart: {
          marginTop: 0,
          marginBottom: 55,
        },
      }),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: {},
    };
    chartName = 'visitSiteData.website';
    this.charts[chartName] = {
      type: 'pie',
      name: 'Top Website',
      dataPath: 'visitSiteData.website',
      chartOptions: _merge({}, require('./chart-config-pie'), {
        chart: {
          marginTop: 0,
          marginBottom: 55,
        },
      }),
      onInitialized: this.chartInitialized.bind(this, chartName),
      series: {},
    };
  }

  async loadDashboard() {
    let that = this;
    const data = await this.Report
      .get({ filter: this.filter, reports: this.reportsToLoad })
      .$promise;
    convertApData(data.ApStatics, this.apDetail, this.gridApiUser);
    data.tracking.macFrequency = macFrequencyConvert(data.tracking);
    if (data.visitSiteData.total) {
      document.getElementById('top_interest').style.display = 'block';
      data.visitSiteData = this.visitSiteDataConvert(data.visitSiteData);
    } else {
      document.getElementById('top_interest').style.display = 'none';
      delete data.visitSiteData;
    }
    // Pre calculate ctr
    const actionData = _get(data, 'tracking.action', []);
    let totalClick = 0;
    let totalImpression = 0;

    actionData.forEach((dateData) => {
      const impression = _get(dateData.detail.find(i => i.name === 'impression'), 'y', 1);
      const click = _get(dateData.detail.find(i => i.name === 'click'), 'y', 0);

      totalClick += click;
      totalImpression += impression;

      let ctr = click >= impression ? 100 : (click * 100) / impression;
      ctr = parseFloat(ctr.toFixed(1));

      dateData.detail.push({ name: 'impressionLine', y: impression });
      dateData.detail.push({ name: 'clickLine', y: click });
      dateData.detail.push({ name: 'ctr', y: ctr });
    });

    let totalCtr = totalClick >= totalImpression ? 1 : (totalClick * 100) / totalImpression;
    totalCtr = parseFloat(totalCtr.toFixed(1));

    Object.assign(this.overall, { totalClick, totalImpression, totalCtr });

    // Others
    let dataChart, totalPoint, totalCandidate, seriesHash;
    Object.keys(this.charts).forEach((chartName) => {
      if (chartName === 'tracking.topVisitor') {
        updateTopVisitChart(this.charts['tracking.topVisitor'], data.tracking.topVisitor, this.filter, { ap: this.apCats, loc: this.locCats }, this.$rootScope);
      } else if (chartName === 'tracking.topBanner') {
        if (data.tracking.bannerClick && this.filter.campaignId) {
          updateTopBannerChart(this.charts['tracking.topBanner'], data.tracking.bannerClick, this.banCats);
        }
      } else {
        dataChart = _get(data, this.charts[chartName].dataPath, []);
        if (this.charts[chartName].type === 'pie') {
          if (dataChart.length) {
            this.charts[chartName].series = this.serieChart[chartName];
          } else {
            this.charts[chartName].series = {};
          }
        }
        if (this.charts[chartName].type === 'bar') {
          dataChart = barDataConvert(dataChart);
        }
        if (this.charts[chartName].hook) {
          if (!this.serieChart[chartName] && !this.charts[chartName].series) {
            seriesHash = {};
            dataChart.forEach((itemP) => {
              itemP.detail.forEach((itemD) => {
                seriesHash[itemD.name] = { name: itemD.name };
              });
            });
            this.charts[chartName].series = seriesHash;
          }
          if (this.charts[chartName].showCountPoint) { // convert to name Data
            seriesHash = {};
            totalPoint = 0;
            totalCandidate = 0;
            dataChart
              .map((itemP) => {
                itemP.detail = itemP.detail.map((itemD) => {
                  if (Number(itemD.name)) {
                    totalPoint += Number(itemD.name) * itemD.y;
                    totalCandidate += itemD.y;
                  }
                  itemD.name = quality[itemD.name] || itemD.name;
                  seriesHash[itemD.name] = { name: itemD.name };
                  return itemD;
                });
                return itemP;
              });
            this.charts[chartName].meanScore = (totalPoint / totalCandidate).toFixed(2);
            this.charts[chartName].hook
              .updateOptions({
                tooltip: {
                  pointFormatter: () => `Score: <b> ${that.charts[chartName].meanScore} </b><br><span style="color:${this.color}">${this.name}</span>: <b>${this.percentage.toFixed(1)}%</b> (${this.y}) `,
                }
              });

            this.charts[chartName].series = seriesHash;
            this.charts[chartName].hook
              .updateData(dataChart);
            // .updateData([{name: '', detail: _map(dataPathHash, (val, key)=>({name: quality[key]||key, y: val}))}]);
          } else {
            this.charts[chartName].hook
              .updateData(dataChart);
          }
        }
      }
    });

    this.actionsData = { impression: 0, click: 0, ctrl: 0 };
    animateValue('impression', 0, 0, 1);
    animateValue('click', 0, 0, 1);
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
      animateValue('ctr', 0, this.actionsData.ctr || 0, 500, '%');
    }, 200);

    // dsp data
    if (data.share) {
      this.dspData = data.share.sum || {};
      if (!this.dspData.click || !this.dspData.impression) {
        this.dspData.ctr = 0;
      } else {
        this.dspData.ctr = (this.dspData.click / this.dspData.impression) * 100;
      }
      this.gridApiDaily.setRowData(data.share.daily);
      this.gridApiVenue.setRowData(data.share.venue);
    }
  }

  refresh() {
    this.onFilterChanged();
  }
  visitSiteDataConvert(data) {
    let websiteData = _reject(data.website, (i) => i.name === 'www');
    websiteData = websiteData.map((item) => {
      item.name = item.name.replace('www.', '');
      return item;
    });
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
      category: [{ name: '', detail: data.category.map(item => ({ name: item.name || 'Unknown', y: item.y })) }],
    };
  }
}
const convertApData = (data, apCats, api) => {
  let dataGrid = {};
  data.totalVisitor.forEach((item) => {
    if (apCats[item.key]) {
      dataGrid[item.key] = { total: item.countClick.count.value, ...apCats[item.key] };
    }
  });
  data.dayAp.forEach((item) => {
    if (dataGrid[item.key]) {
      dataGrid[item.key].today = item.value;
    } else if (apCats[item.key]) {
      dataGrid[item.key] = { total: item.value, ...apCats[item.key], today: item.value };
    }
  });
  data.hourAp.forEach((item) => {
    if (dataGrid[item.key]) {
      dataGrid[item.key].hour = item.value;
    } else if (apCats[item.key]) {
      dataGrid[item.key] = { total: item.value, ...apCats[item.key], today: item.value, hour: item.value };
    }
  });
  delete dataGrid['null'];
  delete dataGrid['undefined'];
  api.setRowData(_map(dataGrid, (item, key) => ({ ...item, mac: key })));
};
const barDataConvert = (data) => {
  let detailData = {};
  data.forEach((item) => {
    item.detail.forEach((dot) => {
      if (detailData[dot.name]) {
        detailData[dot.name].y += dot.y;
      } else {
        detailData[dot.name] = dot;
      }
    });
  });
  return [{ name: '', detail: _map(detailData, x => x) }];
};
const macFrequencyConvert = (data) => {
  let macFrequency = { '10+': 0, '6-10': 0, '2-5': 0, '1': data.totalVisitor };
  if (!data.macFrequency.length && !data.totalVisitor) { return []; }
  data.macFrequency.forEach((item) => {
    switch (item.doc_count) {
      case 2:
      case 3:
      case 4:
      case 5:
        macFrequency['2-5']++; macFrequency['1']--;
        break;
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
        macFrequency['6-10']++; macFrequency['1']--;
        break;
      default: macFrequency['10+']++; macFrequency['1']--;

    }
  });
  return [{
    name: '',
    detail: [
      { name: '1', y: macFrequency['1'] },
      { name: '2-5', y: macFrequency['2-5'] },
      { name: '6-10', y: macFrequency['6-10'] },
      { name: '10+', y: macFrequency['10+'] },
    ],
  }];
};
const updateTopBannerChart = (chart, data, cats) => {
  let series = {};
  data.forEach((item) => {
    item.name = cats[item.key] || 'Unknown';
    if (item.countClick.count.value) {
      series[item.name] = { name: item.name };
    }
  });
  const convertData = [{
    name: '', detail: data.map((item) => {
      return { name: item.name, y: item.countClick.count.value }
    })
  }];
  chart.series = series;
  // chart.hook.updateOptions({chart: {marginBottom: 0}})
  chart.hook.updateData(convertData);
};
const updateTopVisitChart = (chart, data, filter, cats, rootScope) => {
  let series = {}, dataArr = [];
  data.forEach((item, idx) => {
    item.name = cats.loc[item.key] || cats.ap[item.key] || cats.ap[item.key.toUpperCase()] || 'Unknown';
    if (item.countClick.count.value) {
      series[item.name] = { name: item.name };
      dataArr.push({ name: item.name, y: item.countClick.count.value });
    }
  });
  const convertData = [{ name: '', detail: dataArr }];
  if (filter.locationId) {
    chart.name = 'AP';
  } else {
    chart.name = rootScope.isLang === 'VN' ? 'Địa điểm' : 'Location';
  }
  chart.series = series;
  // chart.hook.updateOptions({chart: {marginBottom: 0}})
  chart.hook.updateData(convertData);
};
const animateValue = (id, start, end, duration, subStr = '') => {
  // assumes integer values for start and end
  const obj = document.getElementById(id);
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
export default angular
  .module('app.dashboard.controller', [
    'agGrid',
    'app.directive.dateRangePicker',
    'app.directive.select2',
    'app.directive.highchart',
    require('./chart-config').name,
  ])
  .controller('DashboardCtrl', DashboardCtrl);
