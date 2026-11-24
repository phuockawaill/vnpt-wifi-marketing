import moment from 'moment';
import _findIndex from 'lodash/findIndex';
import gridCellActionTemplate from './grid.cell-action.pug';

class LicenseCtrl {
  constructor(LoopBackResource, $window, $rootScope, alertify, User, AppConfig, Messages, License, currentUser, licenses, accounts) {
    this.LoopBackResource = LoopBackResource;
    this.$window = $window;
    this.$rootScope = $rootScope;

    this.alertify = alertify;
    this.Messages = Messages;
    this.AppConfig = AppConfig;
    this.License = License;
    this.User = User;
    this.currentUser = currentUser;
    this.licenses = licenses;
    this.viewHeight = window.innerHeight;

    this.historyList = [];
    this.accountMap = {};
    this.accounts = accounts.filter(usr => usr.profileName === 'admin' || usr.profileName === 'client').map((item) => { item.description = `${item.username} (${item.profileName})`; return item; });
    accounts.forEach((item) => {
      this.accountMap[item.id] = item;
    });
    console.log(this.accountMap);
    this.selectAccountOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn một tài khoản' : 'Pick an account',
      data: this.accounts.map(item => ({ id: item.id, text: item.description }))
    };
    this.initFilter();
    this.initGrid();
    this.obj = {};
    this.objChange = {};
    this.approveList = [];
  }

  initFilter() {
    this.statusFilters = [
      { text: 'All status', value: undefined, class: 'btn-default' },
      { text: 'Processing', value: 0, class: 'bg-warning' },
      { text: 'Submitted', value: 2, class: 'bg-primary' },
      { text: 'Approved', value: 1, class: 'bg-primary' },
      { text: 'Activated', value: 99, class: 'bg-success' },
      { text: 'Expried', value: 100, class: 'bg-grey' },
      { text: 'Cancelled', value: 101, class: 'bg-danger' }
    ];

    this.filters = {
      status: this.statusFilters[0] // running
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
    this.gridOptions = {
      columnDefs: [
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
          field: '',
          width: 100,
          suppressSorting: true,
          cellRenderer: params => params.rowIndex + 1
        },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Mã' : 'Key', field: 'key', width: 200 },
        { headerName: this.$rootScope.isLang === 'VN' ? 'Loại' : 'Type', field: 'type', width: 100 },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Trạng thái' : 'Status',
          field: 'status',
          width: 150,
          filter: 'text',
          cellClass: 'text-center',
          cellRenderer: (params) => {
            switch (params.value) {
              case 0:
                return '<span class="text-warning">Processing</span>';
              case 1:
                return '<span class="text-primary">Approved</span>';
              case 2:
                return '<span class="text-primary">Submitted</span>';
              case 99:
                return '<span class="text-success">Actived</span>';
              case 100:
                return '<span class="text-muted">Expried</span>';
              case 101:
                return '<span class="text-danger">Cancelled</span>';
              default:
                return params.value.capitalize();
            }
          }
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Thuộc tài khoản' : 'Owner',
          field: 'userId',
          width: 150,
          cellRenderer: params =>
            this.accountMap[params.value] ? this.accountMap[params.value].username || 'Unknown' : 'Deleted'
          // sort: 'desc',
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Số AP' : 'APs',
          field: 'numberAp',
          width: 80
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Thời gian tạo' : 'Created At',
          field: 'createdAt',
          width: 200,
          cellRenderer: params =>
            moment(params.value).format('MMM DD, YYYY HH:mm')
          // sort: 'desc',
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Thời gian hết hạn' : 'Expried At',
          field: 'end',
          width: 200,
          cellRenderer: params =>
            params.value ? moment(params.value).format('MMM DD, YYYY HH:mm') : ''
          // sort: 'desc',
        },
        {
          headerName: this.$rootScope.isLang === 'VN' ? 'Hành động' : 'Actions',
          field: '',
          suppressSorting: true,
          minWidth: 150,
          maxWidth: 150,
          cellClass: 'overflow-visible',
          template: gridCellActionTemplate
        }
      ],
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
      onGridReady: this.onGridReady.bind(this)
    };
  }

  onGridData() {
    this.gridApi.setRowData(this.licenses);
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  onGridReadyForm(event) {
    this.gridApiForm = event.api;
    this.onGridData();
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.licenses.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.licenses, item => item.id === oldRow.id);
      if (newRow) {
        this.licenses.splice(idx, 1, newRow);
      } else {
        this.licenses.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  onAction(action, row, opt) {
    switch (action) {
      case 'changeStatus':
      case 'extendLicense':
      case 'confirmExtend':
      case 'approve':
      case 'new':
      case 'create':
      case 'view':
        this[action](row, opt);
        break;
      default:
        break;
    }
  }

  changeStatus(row, type) {
    this.License.updateStatus({ id: row.id, status: type }).$promise
      .then((ins) => {
        this.alertify.success(this.Messages.updateSuccess);
        this.updateRow(row, ins);
      })
      .catch((err) => {
        this.alertify.error(err.data.error.message);
      });
  }

  approve(row) {
    if (this.accountMap[row.userId].profileName === 'client') {
      this.approveList = this.accounts.filter(usr => usr.id === this.accountMap[row.userId].createdBy || usr.id === row.userId);
      this.objChange = {
        id: row.id,
        active: false
      };
      $('#fmAppLin').modal();
    } else if (row.userId === this.currentUser.id) {
      this.approveList = this.accounts.filter(usr => usr.createdBy === row.userId);
      this.objChange = {
        id: row.id,
        active: false
      };
      $('#fmAppLin').modal();
    } else {
      this.changeStatus(row, 1);
    }
  }

  approveChange() {
    this.License.approveMoveLicense(this.objChange).$promise
      .then((ins) => {
        this.alertify.success(this.Messages.updateSuccess);
        this.refresh(true);
        $('#fmAppLin').modal('hide');
      })
      .catch((err) => {
        this.alertify.error(err.data.error.message);
      });
  }

  extendLicense(row) {
    if (this.currentUser.profileName === 'superadmin' || row.userId === this.currentUser.id) {
      this.objChange = {
        id: row.id,
        key: row.key,
        message: row.end > moment().valueOf() ? 'will exprie at ' : 'has expired at ',
        currentTime: moment(row.end).format('MMM DD, YYYY'),
        nextTime: row.end > moment().valueOf() ? moment(row.end).add(1, 'year').format('MMM DD, YYYY') : moment().add(1, 'year').format('MMM DD, YYYY')
      };
      console.log('extendLicense:', row);
      $('#fmExtendLin').modal();
    }
  }

  confirmExtend() {
    if (this.currentUser.profileName === 'superadmin') {
      console.log('Extend');
      this.License.extendLicense({ id: this.objChange.id }).$promise
        .then((ins) => {
          this.alertify.success(this.Messages.updateSuccess);
          this.refresh(true);
          $('#fmExtendLin').modal('hide');
          this.objChange = {};
        })
        .catch((err) => {
          this.alertify.error(err.data.error.message);
        });
    } else {
      console.log('Request');
    }
  }

  new() {
    this.obj = {};
  }

  create() {
    this.License.createLicense(this.obj).$promise
      .then((ins) => {
        this.alertify.success(this.Messages.createSuccess);
        this.refresh(true);
        $('#fmEditLin').modal('hide');
      })
      .catch((err) => {
        this.alertify.error(err.data.error.message);
      });
  }

  view(row) {
    this.License.findOne({ filter: { where: { id: row.id } } }).$promise
      .then((ins) => {
        this.historyList = ins.history;
        $('#fmHisList').modal();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  formatMoment(val) {
    if (!val) return '';
    return moment(val).format('MMM DD, YYYY HH:mm');
  }

  toogleExpandLicense() {
    $('#fmExpandLicense').modal();
  }

  async refresh(ignore) {
    const query = { order: 'createdAt DESC' };
    if (this.currentUser.profileName === 'admin') {
      const users = await this.User.find().$promise;
      query.where = {
        or: [
          { userId: this.currentUser.id },
          ...users.map(usr => ({ userId: usr.id }))
        ]
      };
    } else if (this.currentUser.profileName !== 'superadmin') {
      query.where = { userId: this.currentUser.id };
    }
    this.License.find({ filter: query }).$promise.then((licenses) => {
      this.licenses = licenses;
      this.onGridData();
      this.obj = {};
      if (!ignore) {
        this.alertify.success(this.Messages.refreshSuccess);
      }
    });
  }
}
export default angular
  .module('app.license.controller', [
    'agGrid',
    'app.directive.select2'
  ])
  .controller('LicenseCtrl', LicenseCtrl);
