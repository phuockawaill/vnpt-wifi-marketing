import _findIndex from 'lodash/findIndex';
import _groupBy from 'lodash/groupBy';
import _cloneDeep from 'lodash/cloneDeep';
import _get from 'lodash/get';

import gridCellActionTemplate from './grid.cell-action.pug';
import gridCellLocationTemplate from './grid.cell-location.pug';
import gridCellBannerTemplate from './grid.cell-banner.pug';
import gridCellKpiTemplate from './grid.cell-kpi.pug';
import audienceFilter from './audience-filter';
import '../banner/banner.less';

let moment;

class CampaignCtrl {
  constructor(lib, $window, $timeout, $state, $rootScope, LoopBackResource, AppConfig, User, Messages, VNMessages, alertify, Campaign, Location, Banner, Brand,
    currentUser, campaigns, banners, locations, brands, ages, genders, incomes, devices, oses, websiteCats, shares
  ) {
    'ngInject';

    const removeModalBackdrop = angular.element(document.querySelectorAll('.modal-backdrop'));
    for (let i = 0; i < removeModalBackdrop.length; i++) {
      angular.element(removeModalBackdrop[i]).remove();
    }

    // Dynamic libs
    moment = lib.moment;

    this.$window = $window;
    this.$timeout = $timeout;
    this.$state = $state;
    this.$rootScope = $rootScope;
    this.LoopBackResource = LoopBackResource;
    this.AppConfig = AppConfig;
    this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;
    this.alertify = alertify;
    this.User = User;
    this.Campaign = Campaign;
    this.Location = Location;
    this.Banner = Banner;
    this.Brand = Brand;

    this.currentUser = currentUser;
    this.campaigns = campaigns;
    this.banners = banners;
    this.locations = locations;
    this.brands = brands;
    this.viewHeight = window.innerHeight;

    // Filter categories
    this.ages = ages;
    this.genders = genders;
    this.incomes = incomes;
    this.devices = devices;
    this.oses = oses;
    this.websiteCats = websiteCats;
    this.shareFlag = shares.length ? shares[0].share : null;
    this.arrStep = [];

    this.initFilter();
    this.initForm();
    this.initGrid();

    this.objBanners = [];
    this.previewMode = 'Laptop';
    this.createBrands = [];
    this.trialUser = currentUser.profileName === 'client' && currentUser.options && currentUser.options.trial;

    this.initJoyRide();
  }

  initJoyRide() {
    setTimeout(() => {
      this.guidance = (this.$state.params && this.$state.params.guidance) ? this.$state.params.guidance : false;
      if (this.guidance) {
        this.startJoyRideCampaign = true;
      } else {
        this.startJoyRideCampaign = false;
      }

      this.joyrideConfigCampaign = [
        {
          type: "element",
          selector: "#joyride-create-campaign",
          heading: "Campaign",
          text: "This page shows your <b>Campaign</b> which you provide.",
          placement: "left",
          scroll: true,
          elementTemplate: (content) => {
            return `
                        <div class='row custom-color'>
                            <div class="col-md-12" style="color: #616374">
                                ${content}
                            </div>
                        </div>
                        <hr>
                        <div class="row custom-bg">
                            <div class="col-md-4">
                                <div class="pull-left">
                                    <button class="skipBtn btn btn-xs btn-link" type="button">
                                        <a><i class="fa fa-ban"></i> Skip</a>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="pull-right">
                                    <button class="nextBtn btn btn-xs btn-primary" type="button">
                                        Next <i class="fa fa-angle-right"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
          }
        }
      ];
    }, 50);
  }

  joyrideFinish(type) {
    if (type === 'skip') {
      this.startJoyRideCampaign = false;
      this.$rootScope.createdGuidance = 'closed';
      return;
    }
    return this.$state.go('admin.location-group', { endedguidance: true, created: moment().valueOf() });
  }

  initForm() {
    this.obj = {};
    this.fm = {
      currentStep: 1,
      totalStep: this.shareFlag ? 2 : 3,
    };
    this.arrStep = [];
    for (let i = 1; i <= this.fm.totalStep; i++) {
      this.arrStep.push(i);
    }
    this.appHostname = this.AppConfig.appHost.split(':')[0];

    this.selectBannerOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn một creative ads' : 'Pick a creative ads',
      tags: true,
      data: this.banners.map(item => ({ id: item.id, text: item.name })),
    };

    this.objBannerChanged = () => {
      if (!this.obj.bannerDefaultId) {
        this.fm.showCreateBanner = false;
        return;
      }

      const idx = _findIndex(
        this.banners,
        item => item.id === this.obj.bannerDefaultId,
      );
      this.fm.showCreateBanner = idx < 0;
    };

    this.addBanner = (bannerId) => {
      if (!bannerId) return;

      const exists = _findIndex(
        this.objBan.selected,
        item => item.bannerId === bannerId,
      ) > -1;
      if (exists) return;

      const index = _findIndex(this.banners, item => item.id === bannerId);
      const banner = this.banners[index];

      this.objBan.selected.push({
        bannerId: banner.id,
        bannerName: banner.name,
        filters: [],
      });

      this.editBanner(this.objBan.selected[this.objBan.selected.length - 1]);
    };

    this.editBanner = (banner) => {
      if (this.objBan.current && this.objBan.current !== banner) {
        this.applyBanner(this.objBan.current);
      }

      this.objBan.current = banner;
      this.inBannerFilter.setFilter(banner.filters);
    };

    this.applyBanner = () => {
      if (!this.objBan.current) return;
      this.objBan.current.filters = this.inBannerFilter.getFilter();
    };

    this.removeBanner = (banner) => {
      const index = _findIndex(
        this.objBan.selected,
        item => item.bannerId === banner.bannerId,
      );
      this.objBan.selected.splice(index, 1);

      if (this.objBan.current === banner && this.objBan.selected.length) {
        const next = index % this.objBan.selected.length;
        this.editBanner(this.objBan.selected[next]);
      } else if (!this.objBan.selected.length) {
        delete this.objBan.current;
      }
    };

    const locationGroups = _groupBy(this.locations, 'categoryName');
    const locations = Object.keys(locationGroups).map(group => ({
      id: group,
      text: group || 'Others',
      children: locationGroups[group].map(item => ({
        id: item.id,
        text: item.name,
      })),
    }));
    this.selectLocationOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn location(s)' : 'Pick some locations',
      dropdownCssClass: 'selectLocation',
      closeOnSelect: false,
      data: locations,
    };

    this.dateOptions = {
      singleDatePicker: true,
      timePicker: true,
      timePicker24Hour: true,
      timePickerSeconds: false,
      showDropdowns: true,
      locale: { format: 'MMM DD, YYYY HH:mm' },
    };
    this.timeOptions = [];
    for (let i = 0; i < 24; i += 1) {
      this.timeOptions.push({ text: i, value: i });
    }

    this.selectDayOfWeekOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn ngày chạy' : 'Pick some days',
      closeOnSelect: false,
      data: [
        { id: 1, text: 'Monday' },
        { id: 2, text: 'Tuesday' },
        { id: 3, text: 'Wednesday' },
        { id: 4, text: 'Thursday' },
        { id: 5, text: 'Friday' },
        { id: 6, text: 'Satuday' },
        { id: 7, text: 'Sunday' },
      ],
    };

    this.setAuMatchingType = (matchAll) => {
      this.matchAllAuFilter = matchAll;
    };

    this.selectBrandOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn brand' : 'Pick Brand',
      tags: true,
      data: this.brands.map(item => ({ id: item.id, text: item.name })),
    };
    this.objBrandChanged = () => {
      if (!this.obj.brands) {
        this.fm.showCreateBrand = false;
        return;
      }
      let hashBrand = {};
      let showCreate = false;
      this.brands.forEach((br) => {
        hashBrand[br.id] = 1;
      });
      this.createBrands = [];
      this.obj.brands.forEach((br) => {
        if (!hashBrand[br]) {
          showCreate = true;
          this.createBrands.push(br);
        }
      });
      this.fm.showCreateBrand = showCreate;
    };

    this.fmNext = () => {
      if (this.fm.currentStep === this.fm.totalStep) return;
      this.fm.currentStep += 1;
    };
    this.fmBack = () => {
      if (this.fm.currentStep === 1) return;
      this.fm.currentStep = this.fm.currentStep - 1;
    };
    this.fmGo = (step) => {
      if (!step || this.fm.currentStep === step) return;
      if (this.fm.currentStep === 2) {
        // Location
        this.applyLocation();
      }

      if (step === 2) {
        this.initAdvancedBanner();
      }

      this.fm.currentStep = step;
      // if(step === 2){
      //     let selectLocation = $('#locationId');
      //     let that = this;
      //     if(!this.setListen){
      //         this.setListen = true;
      //         selectLocation.on('select2:open', function (e) {
      //             setTimeout(()=>{
      //                 let groups = $('.selectLocation ul.select2-results__options')[0].children;
      //                 for(let i=0;i<groups.length;i++){
      //                     groups[i].children[0].style.cursor = 'pointer';
      //                     $(groups[i].children[0]).hover(function(){
      //                           $(this).css("background", "lightgrey");
      //                     }, function(){
      //                           $(this).css("background", "none");
      //                     });
      //                     $(groups[i].children[0]).click(()=>{
      //                         let isClear = true;
      //                         locations[i].children.forEach((item)=>{
      //                             if(!_find(selectLocation.select2('data'), {id: item.id})){
      //                                 isClear = false;
      //                             }
      //                         });
      //                         if(isClear){
      //                           $(groups[i]).find('.select2-results__option').toArray().forEach((e)=>{
      //                                e.setAttribute('aria-selected', false);
      //                           });
      //                           selectLocation.val(_pullAll(selectLocation.select2('data').map((item)=>item.id), locations[i].children.map((item)=>item.id)));
      //                         } else {
      //                           $(groups[i]).find('.select2-results__option').toArray().forEach((e)=>{
      //                                e.setAttribute('aria-selected', true);
      //                           });
      //                           selectLocation.val(locations[i].children.map((item)=>item.id).concat(selectLocation.select2('data').map((item)=>item.id)));
      //                         }
      //                         selectLocation.trigger("change");
      //                        // selectLocation.select2("close");
      //                        // selectLocation.select2("open");
      //                        //objLocs
      //                     });
      //                 }
      //             }, 500);
      //           });
      //     }
      // }
    };
    this.fmClear = () => {
      this.fm.currentStep = 1;
      this.fm.showCreateBrand = false;
      this.fm.showCreateBanner = false;
      for (let i = 1; i <= this.fm.totalStep; i += 1) {
        this[`fmEdit${i}`].$setPristine();
      }

      this.inAuFilter.clearFilter();
    };
    this.fmValid = (step) => {
      if (step && step >= 1 && step <= this.fm.totalStep) {
        return this[`fmEdit${step}`].$invalid;
      }
      for (let i = 1; i <= this.fm.totalStep; i += 1) {
        if (this[`fmEdit${i}`].$invalid) {
          return false;
        }
      }
      return true;
    };
  }

  initFilter() {
    this.statusFilters = [
      { text: 'All status', value: undefined, class: 'btn-default' },
      { text: 'Running', value: 'running', class: 'bg-success' },
      { text: 'Waiting', value: 'scheduled', class: 'bg-warning' },
      { text: 'Invalid', value: 'invalid', class: 'bg-warning' },
      { text: 'Disabled', value: 'stopped', class: 'bg-grey' },
      { text: 'Finished', value: 'finished', class: 'bg-primary' }
    ];

    this.filters = {
      status: this.statusFilters[1] // running
    };

    this.setFilter = (field, filter) => {
      if (!field) return;
      if (!filter) {
        delete this.filters[field];
      } else {
        this.filters[field] = filter;
      }
      this.gridOptions.api.onFilterChanged();
    };

    this.isFilterPresent = () => Object.keys(this.filters).length > 0;

    this.isFilterPass = (node) => {
      if (!this.filters.status || !this.filters.status.value) return true;
      return this.filters.status.value === node.data.status;
    };
  }

  initGrid() {
    const renderDate = (params) => {
      if (params.value) return moment(params.value).format('MMM DD, YYYY');
      return '-';
    };

    this.columnDefs = [
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
        field: '',
        width: 50,
        suppressSorting: true,
        cellRenderer: params => params.rowIndex + 1,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Chiến dịch' : 'Campaign',
        field: 'name',
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Trạng thái' : 'Status',
        field: 'status',
        width: 100,
        filter: 'text',
        cellRenderer: (params) => {
          switch (params.value) {
            case 'running':
              return '<span class="text-success">Running</span>';
            case 'stopped':
              return '<span class="text-muted">Disabled</span>';
            case 'scheduled':
              return '<span class="text-warning">Waiting</span>';
            case 'invalid':
              return '<span class="text-warning">Invalid</span>';
            case 'finished':
              return '<span class="text-primary">Finished</span>';
            default:
              return params.value.capitalize();
          }
        },
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Địa điểm' : 'Location',
        width: 130,
        template: gridCellLocationTemplate,
        // cellRenderer: params =>
        //   `${params.data.locations.length} location${params.data.locations
        //     .length > 1
        //     ? 's'
        //     : ''}`,
      },
      {
        headerName: 'Creative Ads',
        width: 130,
        template: gridCellBannerTemplate,
      },
      {
        headerName: 'KPI',
        field: 'kpi',
        width: 110,
        template: gridCellKpiTemplate,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Từ ngày' : 'From',
        field: 'scheduleFrom',
        width: 130,
        sort: 'desc',
        cellRenderer: renderDate,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Đến ngày' : 'To',
        field: 'scheduleTo',
        width: 130,
        cellRenderer: renderDate,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Người tạo' : 'Created By',
        field: '',
        width: 130,
        cellRenderer: params => (params && params.data) ? (params.data.createdByUsername || '') : '',
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Người cập nhật' : 'Updated By',
        field: '',
        width: 130,
        cellRenderer: params => (params && params.data) ? (params.data.updatedByUsername || '') : '',
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Hành động' : 'Actions',
        field: '',
        suppressSorting: true,
        minWidth: 130,
        maxWidth: 130,
        cellClass: 'overflow-visible',
        template: gridCellActionTemplate,
      },
    ];

    this.gridOptions = {
      columnDefs: this.columnDefs,
      context: this,
      enableColResize: true,
      angularCompileRows: true,

      // filter and sort
      enableSorting: true,
      enableFilter: true,
      isExternalFilterPresent: this.isFilterPresent.bind(this),
      doesExternalFilterPass: this.isFilterPass.bind(this),

      // pagination
      pagination: true,
      paginationAutoPageSize: true,

      animateRows: true,
      rowHeight: 40,
      floatingFiltersHeight: 36,
      headerHeight: 45,

      // hide all menus
      suppressMenuColumnPanel: true,
      suppressMenuFilterPanel: true,
      suppressMenuMainPanel: true,
      getContextMenuItems: () => null,

      // replace default icons
      icons: {
        sortAscending: '<i class="icon-arrow-up8"></i>',
        sortDescending: '<i class="icon-arrow-down8"></i>',
      },
      onGridReady: this.onGridReady.bind(this),
    };
  }

  onGridData() {
    this.gridApi.setRowData(this.campaigns);
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  onAction(action, row) {
    switch (action) {
      case 'new':
        $('#fmEdit').modal();
        this.startJoyRideCampaign = false;
      case 'edit':
      case 'create':
      case 'initDetailKpi':
      case 'applyDetailKpi':
      case 'editDetailKpi':
      case 'delete':
      case 'viewLocation':
      case 'viewBanners':
      case 'preview':
      case 'initAdvancedConfig':
      case 'applyAdvancedConfig':
      case 'addCustomField':
      case 'deleteCustomField':
      case 'refresh':
        this[action](row);
        break;
      case 'enable':
      case 'disable':
        this.updateStatus(action, row);
        break;
      case 'submitLocationStep':
        this.applyLocation();
        this.fmNext();
        break;
      default:
        break;
    }
  }

  closeModal() {
    this.$rootScope.createdGuidance = 'closed';
  }

  buildObject() {
    this.applyAdvancedBanner();
    this.applyLocation();
    this.applyAudience();
    this.applyAdvancedConfig();
    // this.applyDetailKpi();

    const obj = { ...this.obj };

    // Set banner name if exists
    const banner = this.banners.find(item => item.id === obj.bannerDefaultId);
    if (banner) {
      obj.bannerDefaultName = banner.name;
    }

    // // Set brand name if exists
    // const brand = this.brands.find(item => item.id === obj.brands[0]);
    // if (brand) {
    //   obj.brandName = brand.name;
    //   obj.brands.shift(0);
    // }
    return obj;
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.campaigns.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.campaigns, item => item.id === oldRow.id);
      if (newRow) {
        this.campaigns.splice(idx, 1, newRow);
      } else {
        this.campaigns.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  new() {
    this.obj = { scheduleTo: moment().endOf('year').toDate().toISOString(), createdBy: this.currentUser.id };
    this.fmClear();
  }

  edit(row) {
    this.obj = { ...row.toJSON() };
    this.fmClear();
    this.initLocation();
    this.initAudience();
    this.initAdvancedConfig();
    if (!this.obj.brands) {
      this.obj.brands = [];
    }
    this.obj.brands.unshift(this.obj.brandId);
  }

  create() {
    const obj = this.buildObject();
    let chain = Promise.resolve();
    let that = this;

    if (this.fm.showCreateBanner) {
      chain = chain
        .then(
          () =>
            this.Banner.create({
              name: obj.bannerDefaultId,
              htmlCode: 'Please update',
              createdBy: this.currentUser.id
            }).$promise,
        )
        .then((banner) => {
          this.banners.push(banner);
          delete this.fm.showCreateBanner;

          obj.bannerDefaultId = banner.id;
          obj.bannerDefaultName = banner.name;
        })
        .catch((err) => {
          delete obj.bannerDefaultId;
          return Promise.reject(err);
        });
    }

    let createBrandHash = {};
    if (this.fm.showCreateBrand) {
      chain = chain
        .then(
          () =>
            this.Brand.createMany(this.createBrands.map((br, idx) => ({
              name: br,
              username: `please-update-${new Date().getTime() + (idx * 1000)}`,
              email: `please-update-${new Date().getTime() + (idx * 1000)}@domain.com`,
              password: new Date().getTime() + (idx * 1000),
              profileName: 'brand',
              createdBy: this.currentUser.id
            }))).$promise,
        )
        .then((brands) => {
          let createBrandHash = {};
          that.brands.concat(brands).forEach((item) => {
            createBrandHash[item.name] = item;
            createBrandHash[item.id] = item;
          });
          obj.brands = obj.brands.map((item) => {
            if (createBrandHash[item]) return createBrandHash[item].id;
            return item;
          });
          obj.brandId = obj.brands[0].toString();
          obj.brandName = createBrandHash[obj.brands[0]].name.toString();
          that.brands = that.brands.concat(brands);
          that.selectBrandOptions.data = that.brands.map(item => ({ id: item.id, text: item.name }));
          obj.brands = [...obj.brands.slice(1)];
          delete that.fm.showCreateBrand;
        })
        .catch((err) => {
          delete obj.brandId;
          delete obj.brands;
          return Promise.reject(err);
        });
    } else {
      that.brands.forEach((item) => {
        createBrandHash[item.id] = item;
      });
      obj.brandId = obj.brands[0].toString();
      obj.brandName = createBrandHash[obj.brands[0]].name.toString();
      obj.brands = [...obj.brands.slice(1)];
    }
    if (obj.id) {
      if (obj.status === 'invalid') {
        obj.status = 'running';
      }
      chain
        .then(() => this.Campaign.replaceById(obj).$promise)
        .then((savedObj) => {
          this.alertify.success(this.Messages.updateSuccess);
          this.updateRow(obj, savedObj);
          this.edit(savedObj);
        })
        .catch(() => {
          this.alertify.error(this.Messages.updateFailed);
        });
    } else {
      chain
        .then(() => this.Campaign.create(obj).$promise)
        .then((savedObj) => {
          this.alertify.success(this.Messages.createSuccess);
          this.updateRow(undefined, savedObj);
          this.edit(savedObj);
        })
        .catch(() => {
          this.alertify.error(this.Messages.createFailed);
        }).finally(() => {
          setTimeout(() => {
            if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
              return this.$state.go('admin.location-group', { endedguidance: true, created: moment().valueOf() });
            }
          }, 50);
        });
    }
  }

  initLocation() {
    this.objLocs = (this.obj.locations || []).map(item => item.locationId);
  }

  applyLocation() {
    const locations = (this.objLocs || []).map((locationId) => {
      const loc = this.locations.find(item => item.id === locationId);
      const oldLoc = (this.obj.locations || [])
        .find(item => item.locationId === locationId);

      return {
        locationId,
        locationName: loc.name,
        categoryId: loc.categoryId,
        categoryName: loc.categoryName,
        cityId: loc.cityId,
        cityName: loc.cityName,
        kpi: _get(oldLoc, 'kpi'),
        kpiPerDay: _get(oldLoc, 'kpiPerDay'),
        impressionRedirectUrl: _get(oldLoc, 'impressionRedirectUrl'),
        redirectUrl: _get(oldLoc, 'redirectUrl'),
      };
    });

    this.obj.locations = locations;
  }

  initAudience() {
    const audienceFilters = _get(this.obj, 'audience', []);
    this.inAuFilter.setFilter(audienceFilters);
  }

  applyAudience() {
    this.obj.audience = this.inAuFilter.getFilter();
  }

  delete(row) {
    this.alertify.confirm(
      this.Messages.confirmDelete.format(`campaign ${row.name}`),
      () => {
        this.Campaign
          .deleteById({ id: row.id })
          .$promise.then(() => {
            this.updateRow(row);
            this.alertify.success(this.Messages.deleteSuccess);
          })
          .catch(() => {
            this.alertify.error(this.Messages.deleteFailed);
          });
      },
      () => {
        this.alertify.log('You cancelled');
      },
    );
  }

  viewLocation(row) {
    this.obj = { ...row };
  }

  viewBanners(row) {
    let baseFilters = {
      category: 'Interesting Topic',
      gender: 'Gender',
      age: 'Age',
      income: 'Income',
      device: 'Device',
      os: 'Os',
      campaignId: 'Engaged Campaign',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      fb: 'Facebook',
      frequency: 'Frequency',
      visitTime: 'Visits',
      voucher: 'Voucher',
      range: 'Range',
    };
    let baseValue = {
      '$$hasValue': 'Has value',
      '$$noValue': 'Has no value',
      '2': 'Max 2 times',
      '20': 'Max 2 times each Location',
      '6': 'Max 6 times',
      '60': 'Max 6 times each Location',
      '10': 'Max 10 times',
      '100': 'Max 10 times each Location',
    };
    let baseValueTime = {
      '0d': 'First Time in day',
      '1d': 'After first Time in day',
      '0': 'First Time',
      '1': 'Second Time',
      '2': 'Third Time',
      '3': 'Fourth Time',
      '4': 'Fifth Time',
    };
    this.campaigns.forEach((cam) => {
      cam.customFields.forEach((fie) => {
        baseFilters[`survey.${fie.fieldName}`] = fie.displayName;
      });
      baseValue[cam.id] = cam.name;
    });
    this.ages.concat(this.genders, this.devices, this.oses, this.incomes, this.websiteCats).forEach((item) => {
      baseValue[item.value] = item.text;
    });
    let banners = row.banners ? row.banners : [];
    const renderRange = function (fil) {
      let text;
      if (fil.value.type === 'datetime') {
        text = `From ${moment(fil.value.scheduleFrom).format('MMM DD')} -> ${moment(fil.value.scheduleTo).format('MMM DD, YYYY')}`;
        if (fil.value.startTime) {
          text += ` At ${fil.value.startTime.pad()}h -> ${fil.value.endTime.pad()}h`;
        }
      } else {
        text = `From ${fil.value.startTime.pad()}h -> ${fil.value.endTime.pad()}h everyday`;
      }
      return text;
    };
    banners.forEach((ban) => {
      ban.filterRender = '';
      if (ban.filters[0].and && ban.filters[0].and.length) {
        ban.filterRender += 'AND ' + ban.filters[0].and.map((fil) => {
          if (fil.field === 'visitTime') {
            return `${baseFilters[fil.field]}: ${fil.value.map(i => baseValueTime[i]).toString()}`;
          }
          if (fil.field === 'range') {
            return `${baseFilters[fil.field]}: ${renderRange(fil)}`;
          }
          return `${baseFilters[fil.field]}: ${fil.value.map(i => baseValue[i]).toString()}`;
        }).join(' AND ');
      }
      if (ban.filterRender) {
        ban.filterRender += ' || ';
      }
      if (ban.filters[0].or && ban.filters[0].or.length) {
        ban.filterRender += ' OR ' + ban.filters[0].or.map((fil) => {
          if (fil.field === 'visitTime') {
            return `${baseFilters[fil.field]}: ${fil.value.map(i => baseValueTime[i]).toString()}`;
          }
          if (fil.field === 'range') {
            return renderRange(fil);
          }
          return `${baseFilters[fil.field]}: ${fil.value.map(i => baseValue[i]).toString()}`;
        }).join(' OR ');
        ban.filterRender += ')';
      }
    });
    this.objBanners = [{ bannerId: row.bannerDefaultId, bannerName: row.bannerDefaultName, filterRender: 'Default' }].concat(banners);
  }

  preview(id) {
    const urlBase = this.LoopBackResource.getUrlBase().replace(/^https/i, 'http');
    // this.$window.open(`${urlBase}/banners/${row.id}/preview`, '_blank');
    $('#fmBannerPreview').modal();
    let iframe = document.createElement('iframe');
    iframe.src = `${location.origin}/api/banners/${id}/preview`;
    iframe.width = '100%';
    // iframe.height = '700px';
    iframe.style.border = '1px solid darkgray';
    iframe.style.marginTop = '1px';
    iframe.style.overflow = 'hidden';
    setTimeout(() => {
      let container = document.getElementById('previewLink');
      if (container.childNodes[0]) {
        container.removeChild(container.childNodes[0]);
      }
      container.appendChild(iframe);
      this.changeViewMode();
    }, 50);
  }

  changeViewMode(mode) {
    let container = document.getElementById('previewLink');
    let iframe = container.childNodes[0];
    if (!mode) {
      mode = this.previewMode;
    }
    if (mode === 'Laptop') {
      container.style.width = '1026px';
      container.style.height = '666px';
      iframe.height = '655px';
      iframe.maxHeight = '655px';
    } else {
      container.style.width = '375px';
      container.style.height = '677px';
      iframe.height = '667px';
      iframe.maxHeight = '667px';
    }
    let link = iframe.src;
    iframe.src = null;
    setTimeout(() => {
      iframe.src = link;
    }, 600);
    this.previewMode = mode;
    // editor.setDevice(mode);
  }

  closeFrame() {
    let container = document.getElementById('previewLink');
    container.childNodes[0].src = null;
    $('#fmBannerPreview').modal('hide');
  }

  updateStatus(status, row) {
    this.alertify.confirm(
      this.Messages.actionConfirm.format(status, `campaign ${row.name}`),
      () => {
        const action = this.Campaign[status];
        action({ id: row.id }).$promise
          .then((savedObj) => {
            this.updateRow(row, savedObj);
            this.alertify.success(
              this.Messages.actionSuccess.format(status.capitalize()),
            );
          })
          .catch(() => {
            this.alertify.error(
              this.Messages.actionFailed.format(status.capitalize()),
            );
          });
      },
    );
  }

  initDetailKpi() {
    this.kpiObj = _cloneDeep(this.obj.locations);
  }

  editDetailKpi(row, isKpiOnly = false) {
    this.edit(row);
    this.initDetailKpi();
    this.fm.isKpiOnly = isKpiOnly;
  }

  applyDetailKpi() {
    this.obj.locations = this.kpiObj;
    if (this.fm.isKpiOnly) {
      this.fm.isKpiOnly = false;
      this.create();
    }
  }

  initAdvancedConfig() {
    this.cfObj = { countPoint: false };
    this.fbObj = _cloneDeep(this.obj.fb);
    this.ggObj = _cloneDeep(this.obj.gg);
    this.cfObjs = _get(this.obj, 'customFields', []).map(item => ({
      fieldName: item.fieldName,
      displayName: item.displayName,
      countPoint: item.countPoint,
    }));
  }

  addCustomField() {
    if (!this.cfObj.fieldName || !this.cfObj.displayName) {
      return;
    }

    let index = _findIndex(
      this.cfObjs,
      item => item.fieldName === this.cfObj.fieldName,
    );
    if (index < 0) {
      index = this.cfObjs.length;
    }
    this.cfObjs.splice(index, 1, {
      fieldName: this.cfObj.fieldName,
      displayName: this.cfObj.displayName,
      countPoint: this.cfObj.countPoint,
    });
  }

  deleteCustomField(index) {
    this.cfObjs.splice(index, 1);
  }

  applyAdvancedConfig() {
    this.obj.customFields = (this.cfObjs || []).map(item => ({
      fieldName: item.fieldName,
      displayName: item.displayName,
      countPoint: item.countPoint,
    }));

    this.obj.fb = this.fbObj;
    this.obj.gg = this.ggObj;
  }

  initAdvancedBanner() {
    this.objBan = {
      selected: (this.obj.banners || [])
        .map(item => ({ ...item })),
    };
  }

  applyAdvancedBanner() {
    this.applyBanner();
    this.obj.banners = this.objBan.selected || this.obj.banners || [];
  }

  async refresh() {
    let query = {};
    if (this.currentUser.profileName === 'admin') {
      const users = await this.User.find().$promise;
      query = { where: { createdBy: { inq: users.map(usr => usr.id).concat(this.currentUser.id) } } };
    } else if (this.currentUser.profileName !== 'superadmin') {
      query = { where: { createdBy: this.currentUser.id } };
    }
    this.Campaign.find({ filter: query }).$promise.then((campaigns) => {
      this.campaigns = campaigns;
      this.onGridData();

      this.obj = {};
      this.kpiObj = {};
      this.fbObj = {};
      this.ggObj = {};
      this.cfObj = {};
      this.cfObjs = [];

      this.alertify.success(this.Messages.refreshSuccess);
    });
  }
}

export default angular
  .module('app.campaign.controller', [
    'agGrid',
    'app.directive.select2',
    'app.directive.dateRangePicker',
    'app.directive.tooltip',
    'ngJoyRide',
    audienceFilter.name,
  ])
  .controller('CampaignCtrl', CampaignCtrl);
