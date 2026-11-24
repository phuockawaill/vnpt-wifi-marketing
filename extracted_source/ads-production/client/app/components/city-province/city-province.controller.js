import _findIndex from 'lodash/findIndex';
import gridCellActionTemplate from './grid.cell-action.pug';
import gridCellActionEditTemplate from './grid.cell-action-template.pug';
import './city-province.less';

class CityProvinceCtrl {
  constructor($rootScope, LoopBackResource, $window, alertify, Messages, VNMessages, SelectOption, currentUser, cities) {
    this.$rootScope = $rootScope;
    this.LoopBackResource = LoopBackResource;
    this.$window = $window;

    this.alertify = alertify;
    this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;

    this.City = SelectOption;

    this.cities = cities;
    this.currentUser = currentUser;
    this.obj = {};
    this.districtActions = [];
    this.districts = [];
    this.districtsPagings = [];
    this.selectPagination = "10";
    this.isPaging = true;
    this.dtpage = {
      limit: parseInt(this.selectPagination),
      offset: 0,
      searchAll: '',
    };
    this.currentPage = (this.dtpage.offset && (Math.ceil(parseInt(this.dtpage.offset) / parseInt(this.dtpage.limit)) + 1)) || 1;
    this.lastPage = Math.ceil(parseInt(this.districts.length) / parseInt(this.dtpage.limit));

    this.initForm();
    this.initGrid();

    this.accountCreatedBy = {};
    this.childUsers = [];
  }

  initForm() {
    this.selectLocationOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn địa điểm' : 'Pick a location',
      tags: true,
      multiple: true,
      data: [],
    };
    this.objLocationChanged = () => {

    };
  }

  initGrid() {
    this.columnDefs = [
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
        field: '',
        width: 50,
        suppressSorting: true,
        cellRenderer: params => params.rowIndex + 1,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Thành phố/Tỉnh' : 'City/Province', field: 'text', minWidth: 100,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Quận/huyện' : 'District',
        field: 'options',
        cellClass: 'overflow-visible',
        cellClass: 'text-center',
        template: gridCellActionTemplate,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Hành động' : 'Action',
        field: 'options',
        cellClass: 'overflow-visible',
        cellClass: 'text-center',
        hide: this.currentUser.profileName !== 'superadmin',
        template: gridCellActionEditTemplate,
      }
    ];

    this.gridOptions = {
      columnDefs: this.columnDefs,
      context: this,
      enableColResize: true,
      angularCompileRows: true,
      enableSorting: true,
      enableFilter: true,

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
        sortDescending: '<i class="icon-arrow-down8"></i>',
      },
      onGridReady: this.onGridReady.bind(this),
    };
  }

  onGridData() {
    this.gridApi.setRowData(this.cities);
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  onAction(action, row) {
    switch (action) {
      case 'new':
      case 'edit':
      case 'delete':
      case 'listDistrict':
      case 'refresh':
        this[action](row);
        break;
      default:
        break;
    }
  }

  new() {
    this.obj = {
      type: 'city',
      text: '',
      value: '',
      locationId: [],
      options: {}
    };
    this.selectLocationOptions.data = [];
  }

  edit(row) {
    this.obj = { ...row };
    delete this.obj.$promise;
    delete this.obj.$resolved;
    if (this.obj.options && this.obj.options.district) {
      this.districtActions = this.obj.options.district;
      this.districtActions.map(l => {
        l.id = l.value;
        return l;
      });
      this.obj.locationId = this.districtActions.map(d => { return d.id; });
      this.selectLocationOptions.data = angular.copy(this.districtActions);
    } else {
      this.selectLocationOptions.data = [];
      this.obj.locationId = [];
    }
  }

  delete(row) {
    let messages = this.Messages.confirmDelete.format(`City/Province ${row.text}`);
    this.alertify.confirm(messages, () => {
      this.City
        .deleteById({ id: row.id }).$promise
        .then(() => {
          this.updateRow(row);
          this.alertify.success(this.Messages.deleteSuccess);
        }).catch(() => {
          this.alertify.error(this.Messages.deleteFailed);
        });
    }, () => {
      this.alertify.log('You cancelled');
    });
  }

  create() {
    delete this.obj.$promise;
    delete this.obj.$resolved;
    this.obj.value = this.convertViet(this.obj.value);
    if (this.obj.locationId && this.obj.locationId.length > 0) {
      let districts = [];
      if (this.obj.options) {
        this.obj.locationId.forEach(l => {
          let t = {
            text: "",
            value: ""
          };
          let found = this.districtActions.find(d => d.value === l);
          if (found) {
            t.text = found.text;
            t.value = found.value;
            districts.push(t);
          } else {
            t.text = l;
            let dau = this.convertViet(l);
            t.value = `${dau}_${Math.random().toString(36).slice(2, 6)}_${this.obj.value}`;
            districts.push(t);
          }
        });
      } else {
        this.obj.options = {};
        this.obj.locationId.forEach(l => {
          let t = {
            text: "",
            value: ""
          };
          t.text = l;
          let dau = this.convertViet(l);
          t.value = `${dau}_${Math.random().toString(36).slice(2, 6)}_${this.obj.value}`;
          districts.push(t);
        });
      }
      this.obj.options.district = districts;
    } else {
      if (this.obj.options && this.obj.options.district) {
        delete this.obj.options.district;
      }
    }
    let template = angular.copy(this.obj);
    delete template.locationId;
    if (this.obj.id) {
      this.City.replaceById(template).$promise
        .then((savedObj) => {
          this.alertify.success(this.Messages.updateSuccess);
          this.updateRow(this.obj, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.updateFailed);
        });
    } else {
      this.City.create(template).$promise
        .then((savedObj) => {
          this.alertify.success(this.Messages.createSuccess);
          this.updateRow(null, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.createFailed);
        });
    }
  }

  convertViet(string) {
    var viet = [
      { char: 'a', regex: 'á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ' },
      { char: 'o', regex: 'ó|ò|ỏ|õ|ọ|ơ|ớ|ờ|ở|ỡ|ợ|ô|ố|ồ|ổ|ỗ|ộ' },
      { char: 'e', regex: 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ' },
      { char: 'u', regex: 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự' },
      { char: 'i', regex: 'í|ì|ỉ|ĩ|ị' },
      { char: 'y', regex: 'ý|ỳ|ỷ|ỹ|ỵ' },
      { char: 'd', regex: 'đ|ð' },
      { char: '', regex: ' ' }
    ];

    for (var cas of viet) {
      string = string.replace(new RegExp(cas.regex, 'g'), cas.char);
      string = string.replace(new RegExp(cas.regex.toUpperCase(), 'g'), cas.char.toUpperCase());
    }

    return string;
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.cities.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.cities, item => item.id === oldRow.id);
      if (newRow) {
        this.cities.splice(idx, 1, newRow);
      } else {
        this.cities.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  listDistrict(data) {
    this.districts = data.options && data.options.district ? data.options.district : [];
    this.districtsPagings = this.districts;
    this.handleDistrictList("limit");
  }

  refresh() {
    let query = { where: { type: 'city' } };
    this.City
      .find({ filter: query }).$promise
      .then((cities) => {
        this.cities = cities;
        this.onGridData();
        this.obj = {};

        this.alertify.success(this.Messages.refreshSuccess);
      });
  }

  handleDistrictList(type) {
    this.isPaging = true;
    this.districtsPagings = [];
    switch (type) {
      case 'limit':
        this.dtpage.offset = 0;
        this.dtpage.limit = parseInt(this.selectPagination);
        break;
      case 'search':
        this.dtpage.offset = 0;
        this.isPaging = false;
        break;
      case 'next':
        this.dtpage.offset = parseInt(this.selectPagination) + parseInt(this.dtpage.offset);
        break;
      case 'previous':
        this.dtpage.offset = (parseInt(this.dtpage.offset) > parseInt(this.dtpage.limit) && parseInt(this.dtpage.offset) - parseInt(this.dtpage.limit)) || 0;
        break;
      case 'first':
        this.dtpage.offset = 0;
        break;
      case 'last':
        this.totalPage = Math.ceil(parseInt(this.districts.length) / parseInt(this.dtpage.limit));
        this.dtpage.offset = (parseInt(this.totalPage) * parseInt(this.dtpage.limit)) - parseInt(this.dtpage.limit);
        break;
      default:
        break;
    }
    this.currentPage = (this.dtpage.offset && (Math.ceil(parseInt(this.dtpage.offset) / parseInt(this.dtpage.limit)) + 1)) || 1;
    this.lastPage = Math.ceil(parseInt(this.districts.length) / parseInt(this.dtpage.limit));
    if (type == "search") {
      if (this.searchDT) {
        let lowerDistrict = this.searchDT.toLowerCase();
        this.districtsPagings = this.districts.filter(function (d) {
          let lowerD = d.text.toLowerCase();
          if (lowerD.indexOf(lowerDistrict) > -1) {
            return true;
          }
          return false;
        });
      } else {
        this.isPaging = true;
        for (let p = 0; p < this.districts.length; p++) {
          if (this.dtpage.offset <= p && p < (this.dtpage.offset + parseInt(this.selectPagination))) {
            this.districtsPagings.push(this.districts[p]);
          }
        }
      }
    } else {
      for (let p = 0; p < this.districts.length; p++) {
        if (this.dtpage.offset <= p && p < (this.dtpage.offset + parseInt(this.selectPagination))) {
          this.districtsPagings.push(this.districts[p]);
        }
      }
    }
  }
}

export default angular
  .module('app.city-province.controller', ['agGrid', 'app.directive.select2'])
  .controller('CityProvinceCtrl', CityProvinceCtrl);