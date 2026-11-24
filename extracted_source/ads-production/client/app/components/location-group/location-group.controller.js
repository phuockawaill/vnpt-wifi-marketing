import _findIndex from 'lodash/findIndex';
import moment from 'moment';
import gridCellActionLocationTemplate from './grid.cell-action-location.pug';
import gridCellActionTemplate from './grid.cell-action.pug';
import './location.less';
const baseHotspotDir = 'hotspot/login.html';

class LocationGroupCtrl {
  constructor($state, $rootScope, LoopBackResource, $window, alertify, User, Messages, VNMessages, SelectOption, Location, locationGroups, currentUser, locations) {
    const removeModalBackdrop = angular.element(document.querySelectorAll('.modal-backdrop'));
    for (let i = 0; i < removeModalBackdrop.length; i++) {
      angular.element(removeModalBackdrop[i]).remove();
    }

    this.LoopBackResource = LoopBackResource;
    this.$window = $window;
    this.$state = $state;
    this.$rootScope = $rootScope;

    this.alertify = alertify;
    this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;
    this.User = User;
    this.LocationGroup = SelectOption;
    this.Location = Location;

    this.locations = locations;
    this.locationGroups = locationGroups;
    this.currentUser = currentUser;
    this.obj = {};
    this.hotspotDir = baseHotspotDir;
    this.hotspotTypes = [
      { id: 'default', name: 'Genex' },
      { id: 'engenius', name: 'Engenius' },
      { id: 'aruba', name: 'Aruba Virtual Controller' },
      { id: 'aruba_mobility', name: 'Aruba Mobility Controller' },
      { id: 'tplink', name: 'TP-Link Omada Controller' },
      { id: 'ruckus_cloud', name: 'Ruckus Cloud WISPr' },
      { id: 'ruckus', name: 'Ruckus vSz Cloud' },
      { id: 'ruckus_alone', name: 'Ruckus Unleashed' },
      { id: 'ruckus_hotzone', name: 'Ruckus Multimedia Hotzone' },
      { id: 'ruijie', name: 'Ruijie Cloud MACC' },
      { id: 'ruijieGateway', name: 'Ruijie Gateway' },
      { id: 'aerohive', name: 'Aerohive' },
      { id: 'extreme', name: 'Extreme Networks (WiNG)' },
      { id: 'unifi', name: 'UniFi' },
      { id: 'mikrotik', name: 'Mikrotik RouterOS' },
      { id: 'draytek', name: 'Draytek Vigor' },
      { id: 'chillispot', name: 'Chillispot Hotspot' },
      { id: 'cisco_wlc', name: 'Cisco WLC 5520' },
      { id: 'zyxelNebula', name: 'Zyxel Nebula Cloud' }
    ];
    this.locationList = [];
    this.viewHeight = window.innerHeight;
    this.locationDisplay = [];
    this.locationPagings = [];
    this.selectPagination = '10';
    this.isPaging = true;
    this.dtpage = {
      limit: parseInt(this.selectPagination),
      offset: 0,
      searchAll: '',
    };
    this.currentPage = (this.dtpage.offset && (Math.ceil(parseInt(this.dtpage.offset) / parseInt(this.dtpage.limit)) + 1)) || 1;
    this.lastPage = Math.ceil(parseInt(this.locationDisplay.length) / parseInt(this.dtpage.limit));
    this.trialUser = currentUser.profileName === 'client' && currentUser.options && currentUser.options.trial;

    this.initForm();
    this.initGrid();
    this.initJoyRide();

    this.quickLocationGroup = (this.$state.params && this.$state.params.quickLocationGroup) ? this.$state.params.quickLocationGroup : false;
    if (this.quickLocationGroup) {
      setTimeout(() => {
        if (this.$state.params && this.$state.params.quickLocationGroupObj && this.$state.params.quickLocationGroupObj.id) {
          this.onAction('exportUrl', this.$state.params.quickLocationGroupObj);
        }
      }, 1000);

      setTimeout(() => {
        if (this.$state.params && this.$state.params.quickLocationGroupObj && this.$state.params.quickLocationGroupObj.id) {
          $('#fmUrl').modal();
        }
      }, 1500);
    }
  }

  initJoyRide() {
    setTimeout(() => {
      this.guidance = (this.$state.params && this.$state.params.guidance) ? this.$state.params.guidance : false;
      this.endedguidance = (this.$state.params && this.$state.params.endedguidance) ? this.$state.params.endedguidance : false;
      if (this.guidance || this.endedguidance) {
        this.startJoyRideLocGr = true;
      } else {
        this.startJoyRideLocGr = false;
      }

      if (this.endedguidance) {
        this.joyrideConfigLocGr = [
          {
            type: "title",
            heading: "Done",
            text: "Congratulations, Your setup has done!!!",
          }
        ];
      } else {
        this.joyrideConfigLocGr = [
          {
            type: "element",
            selector: "#joyride-create-wifi-network",
            heading: "Wifi Network",
            text: "This page shows your <b>Wifi Network</b> which you provide. You can change your Wifi Network name and choose locations options.",
            placement: "bottom",
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
      }
    }, 50);
  }

  joyrideFinish(type) {
    if (type === 'skip') {
      this.startJoyRideLocGr = false;
      this.$rootScope.createdGuidance = 'closed';
      return;
    }

    if (this.endedguidance) {
      this.startJoyRideLocGr = false;
      this.$rootScope.createdGuidance = 'closed';
      return;
    }
    return this.$state.go('admin.banner', { guidance: true, created: moment().valueOf() });
  }

  initForm() {
    this.fm = {};
    this.locations.map((l) => {
      l.text = l.name;
      return l;
    });
    this.selectLocationOptions = {
      width: '100%',
      placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn địa điểm' : 'Pick locations',
      closeOnSelect: false,
      data: this.locations,
    };
    this.objLocationChanged = () => {
      if (!this.obj.locationId) {
        this.fm.showCreateLocation = false;
        return;
      }

      const idx = _findIndex(this.locations, item => item.id === this.obj.locationId);
      this.fm.showCreateGroup = (idx < 0);
    };
  }

  initGrid() {
    this.columnDefs = [
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
        field: '',
        width: 50,
        suppressSorting: true,
        cellRenderer: params => params.rowIndex + 1
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Tên' : 'Name', field: 'text', minWidth: 100
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Người tạo' : 'Created By',
        field: '',
        width: 130,
        cellRenderer: params => (params && params.data) ? (params.data.createdByUsername || '') : ''
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Người cập nhật' : 'Updated By',
        field: '',
        width: 130,
        cellRenderer: params => (params && params.data) ? (params.data.updatedByUsername || '') : ''
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Địa điểm' : 'Locations',
        field: '',
        width: 130,
        template: gridCellActionLocationTemplate
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Hành động' : 'Actions',
        field: '',
        suppressSorting: true,
        minWidth: 230,
        maxWidth: 230,
        cellClass: 'overflow-visible',
        template: gridCellActionTemplate
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
    this.gridApi.setRowData(this.locationGroups);
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.locationGroups.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.locationGroups, item => item.id === oldRow.id);
      if (newRow) {
        this.locationGroups.splice(idx, 1, newRow);
      } else {
        this.locationGroups.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  onAction(action, row) {
    switch (action) {
      case 'new':
        $('#fmEdit').modal();
        this.startJoyRideLocGr = false;
      case 'edit':
      case 'exportUrl':
      case 'generateCode':
      case 'copyCode':
      case 'delete':
      case 'displayLocation':
      case 'refresh':
        this[action](row);
        break;
      default:
        break;
    }
  }

  new() {
    this.obj = {
      type: 'location_category',
      createdBy: this.currentUser.id,
      locationId: [],
      externalParams: {},
      options: { hotspotType: 'default', sessionTimeout: 1800 },
      aerohive: { sessionTimeout: 1800, idleTimeout: 300 },
      unifi: {}
    };
  }

  closeModal() {
    this.$rootScope.createdGuidance = 'closed';
  }

  displayLocation(row) {
    this.locationDisplay = this.locations.filter(lo => lo.categoryId === row.id);
    this.locationPagings = angular.copy(this.locationDisplay);
  }

  edit(row) {
    this.obj = { ...row };
    this.locations.map((l) => {
      l.text = l.name;
      return l;
    });
    this.obj.locationId = this.locations.filter(l => l.categoryId === this.obj.id).map((t) => { return t.id });
    this.selectLocationOptions.data = this.locations;
    this.objCode = {
      id: row.id
    };
    delete this.obj.$promise;
    delete this.obj.$resolved;
  }

  create() {
    // if (!validForm) {
    //   if (this.fmEdit.name) {
    //     this.fmEdit.name.$setDirty();
    //     this.fmEdit.name.$validate();
    //   }

    //   if (this.fmEdit.locationId) {
    //     this.fmEdit.locationId.$setDirty();
    //     this.fmEdit.locationId.$validate();
    //   }

    //   return;
    // }

    this.obj.value = this.obj.text.replace(/[^\w]/g, '').toLowerCase();
    if (!this.obj.options) {
      this.obj.options = { hotspotType: 'default', locationConfig: {}, sessionTimeout: 1800 };
    }
    if (!this.obj.options.locationConfig) {
      this.obj.options.locationConfig = {};
    }
    this.locationList.forEach((loc) => {
      if ((loc.sessionTimeout && loc.sessionTimeout !== this.obj.aerohive.sessionTimeout) || (loc.idleTimeout && loc.idleTimeout !== this.obj.aerohive.idleTimeout)) {
        this.obj.options.locationConfig[loc.id] = { sessionTimeout: loc.sessionTimeout || this.obj.aerohive.sessionTimeout, idleTimeout: loc.idleTimeout || this.obj.aerohive.idleTimeout };
      } else if (this.obj.options.locationConfig[loc.id]) {
        this.obj.options.locationConfig[loc.id] = {};
      }
    });
    delete this.obj.$promise;
    delete this.obj.$resolved;
    if (this.obj.id) {
      const listLocationsIdsForGroup = angular.copy(this.obj.locationId);
      delete this.obj.locationId;
      this.LocationGroup.replaceById(this.obj).$promise
        .then((savedObj) => {
          this.alertify.success(this.Messages.updateSuccess);
          this.UpdateNameLocation(savedObj, listLocationsIdsForGroup);
          this.updateRow(this.obj, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
          $('#fmUrl').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.updateFailed);
        });
    } else {
      let listIdLocation = [];
      if (this.obj.locationId && this.obj.locationId.length > 0) {
        listIdLocation = this.obj.locationId.map((l) => {
          if (l !== '') return l;
        });
      }
      delete this.obj.locationId;
      this.LocationGroup.create(this.obj).$promise
        .then((savedObj) => {
          if (listIdLocation.length > 0) {
            listIdLocation.forEach((lo) => {
              const foundLocation = this.locations.find(l => l.id === lo);
              if (foundLocation) {
                this.updateLocation(foundLocation, savedObj);
              }
            });
          }
          this.alertify.success(this.Messages.createSuccess);
          this.updateRow(null, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.createFailed);
        }).finally(() => {
          setTimeout(() => {
            if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
              return this.$state.go('admin.banner', { guidance: true, created: moment().valueOf() });
            }
          }, 50);
        });
    }
  }

  UpdateNameLocation(locationGroup, listLocationsIdsForGroup) {
    const chain = Promise.resolve();
    let listLocation = this.locations.filter(lg => lg.categoryId === locationGroup.id);
    if (listLocationsIdsForGroup && listLocationsIdsForGroup.length > 0) {
      listLocationsIdsForGroup.forEach((lg) => {
        let foundLocationNewGroup = this.locations.find(lt => lt.id === lg);
        let foundLocationedNewGroup = listLocation.find(ln => ln.id === lg);
        if (foundLocationedNewGroup) {
          foundLocationedNewGroup.categoryName = locationGroup.text;
          let dataLi = angular.copy(foundLocationedNewGroup);
          delete dataLi.text;
          chain
            .then(() => this.Location.replaceById(dataLi).$promise)
            .then((savedObj) => {
            })
            .catch(() => {
              this.alertify.error(this.Messages.updateFailed);
            });
        } else {
          if (foundLocationNewGroup) {
            this.updateLocation(foundLocationNewGroup, locationGroup);
          }
        }
      })
    }
    if (listLocation && listLocation.length > 0) {
      listLocation.forEach((li) => {
        let foundIdHaveGroup = listLocationsIdsForGroup && listLocationsIdsForGroup.length > 0 ? listLocationsIdsForGroup.find(l => l === li.id) : null;
        if (!foundIdHaveGroup) {
          this.updateLocation(li, null);
        }
      });
    }
  }

  updateLocation(location, groupLocation) {
    delete location.text;
    let locationData = angular.copy(location);
    const chain = Promise.resolve();
    if (groupLocation) {
      locationData.categoryId = groupLocation.id;
      locationData.categoryName = groupLocation.text;
    } else {
      delete locationData.categoryId; delete locationData.categoryName;
    }
    delete locationData.$resolved; delete locationData.$promise;
    chain
      .then(() => this.Location.replaceById(locationData).$promise)
      .then((savedObj) => {
        savedObj.text = savedObj.name;
        let index = this.locations.findIndex(lid => lid.id === savedObj.id);
        this.locations.splice(index, 1, savedObj);
      })
      .catch(() => {
        this.alertify.error(this.Messages.updateFailed);
      });
  }

  delete(row) {
    this.alertify.confirm(this.Messages.confirmDelete.format(`Wifi Network ${row.text}`), () => {
      this.LocationGroup
        .deleteById({ id: row.id }).$promise
        .then(() => {
          this.alertify.success(this.Messages.deleteSuccess);
          this.updateRow(row);
          let listLocation = this.locations.filter(lo => lo.categoryId === row.id);
          if (listLocation && listLocation.length > 0) {
            listLocation.forEach((li) => {
              this.updateLocation(li, null);
            });
          }
          this.locations.map((l) => {
            l.text = l.name;
            return l;
          });
          this.selectLocationOptions.data = this.locations;
        }).catch(() => {
          this.alertify.error(this.Messages.createFailed);
        });
    }, () => {
      this.alertify.log('You cancelled');
    });
  }

  async refresh() {
    const query = { where: { type: 'location_category' } };
    if (this.currentUser.profileName === 'admin') {
      const users = await this.User.find().$promise;
      query.where = Object.assign({}, query.where, { createdBy: { inq: users.map(usr => usr.id).concat(this.currentUser.id) } });
    } else if (this.currentUser.profileName !== 'superadmin') {
      query.where = Object.assign({}, query.where, { createdBy: this.currentUser.id });
    }

    this.LocationGroup
      .find({ filter: query }).$promise
      .then((locationGroups) => {
        this.locationGroups = locationGroups;
        this.onGridData();
        this.obj = {};

        this.alertify.success(this.Messages.refreshSuccess);
      });
  }

  exportUrl(row) {
    this.obj = { ...row };
    this.locations.map((l) => {
      l.text = l.name;
      return l;
    });
    this.obj.locationId = this.locations.filter(l => l.categoryId === this.obj.id).map((t) => t.id);
    this.selectLocationOptions.data = this.locations;
    if (!this.obj.options) {
      this.obj.options = { hotspotType: 'default' };
    }
    let locationList = this.locations.filter(lo => lo.categoryId === row.id)
    this.locationList = angular.copy(locationList);
    if (this.obj.options.locationConfig) {
      this.locationList = locationList.map(loc => Object.assign({}, loc, this.obj.options.locationConfig[loc.id] || {}));
    }
    // if(row.externalParams){this.inspectEngenius = true;}
    // else {this.inspectEngenius = false;}
    // if(row.unifi){this.inspectUnifi = true;}
    // else {this.inspectUnifi = false;}
    this.objCode = {
      id: row.id
    };
    delete this.obj.$promise;
    delete this.obj.$resolved;
  }

  checkChangeType() {
    if (this.obj.options.hotspotType === 'unifi' && !this.obj.unifi) {
      this.obj.unifi = {};
    }
    if (['default', 'engenius', 'ruijie', 'ruijieGateway'].indexOf(this.obj.options.hotspotType) > -1 && !this.obj.externalParams) {
      this.obj.externalParams = {};
    }
    if (['aerohive', 'mikrotik', 'draytek'].indexOf(this.obj.options.hotspotType) > -1 && !this.obj.aerohive) {
      this.obj.aerohive = {
        sessionTimeout: 1800,
        idleTimeout: 300
      };
    }
    this.objCode.url = '';
    this.objCode.successUrl = '';
    this.objCode.options = {};
    setTimeout(() => {
      $('[data-toggle="popover"]').popover({
        trigger: 'hover'
      });
    }, 1000);
  }

  generateCode() {
    const chain = Promise.resolve();
    delete this.obj.$promise;
    delete this.obj.$resolved;
    this.objCode.type = this.obj.options.hotspotType;
    chain
      .then(() => this.LocationGroup
        .getExternalUrl(this.objCode).$promise
        .then((response) => {
          if (this.obj.options.hotspotType === 'mikrotik') {
            this.objCode.url = this.hotspotDir !== baseHotspotDir ? response.jsCode.replace(baseHotspotDir, this.hotspotDir) : response.jsCode;
          } else {
            this.objCode.url = response.jsCode;
          }
          this.objCode.successUrl = response.successUrl;
          if (response.options) {
            this.objCode.options = response.options;
          }
        }))
      .catch(err => console.log(err));
  }

  copyCode(type) {
    document.getElementById(type).select();
    try {
      if (document.execCommand('copy')) {
        this.alertify.success(this.Messages.copyToClipboardSuccess);
      } else {
        this.alertify.success(this.Messages.copyToClipboardFailed);
      }
    } catch (err) {
      this.alertify.success(this.Messages.copyToClipboardFailed);
    }
  }

  verifyUnifiLogin() {
    const chain = Promise.resolve();
    document.getElementById('verifyUnifiLogin').disabled = true;
    document.getElementById('verifyUnifiLogin').innerHTML = 'Processing...';
    chain
      .then(() => this.LocationGroup.verifyUnifiLogin(this.obj.unifi).$promise)
      .then((res) => {
        document.getElementById('verifyUnifiLogin').disabled = false;
        document.getElementById('verifyUnifiLogin').innerHTML = 'Verify';
        if (res.reason) {
          alert(`Login failed, ${res.reason}`);
        } else {
          alert('Login success!');
        }
      })
      .catch(err => console.log(err));
  }

  tooglePassword() {
    const pass = document.getElementById('passwordUnifi');
    if (pass.type === 'password') {
      pass.type = 'text';// icon-eye-blocked
      document.getElementById('passwordIcoUnifi').className = 'icon-eye-blocked';
    } else {
      pass.type = 'password';// icon-eye
      document.getElementById('passwordIcoUnifi').className = 'icon-eye';
    }
  }

  handleLocationList(type) {
    this.isPaging = true;
    this.locationPagings = [];
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
        this.totalPage = Math.ceil(parseInt(this.locationDisplay.length) / parseInt(this.dtpage.limit));
        this.dtpage.offset = (parseInt(this.totalPage) * parseInt(this.dtpage.limit)) - parseInt(this.dtpage.limit);
        break;
      default:
        break;
    }
    this.currentPage = (this.dtpage.offset && (Math.ceil(parseInt(this.dtpage.offset) / parseInt(this.dtpage.limit)) + 1)) || 1;
    this.lastPage = Math.ceil(parseInt(this.locationDisplay.length) / parseInt(this.dtpage.limit));
    if (type === 'search') {
      if (this.searchLC) {
        let lowerLocation = this.searchLC.toLowerCase();
        this.locationPagings = this.locationDisplay.filter((d) => {
          let lowerD = d.name.toLowerCase();
          if (lowerD.indexOf(lowerLocation) > -1) {
            return true;
          }
          return false;
        });
      } else {
        this.isPaging = true;
        for (let p = 0; p < this.locationDisplay.length; p++) {
          if (this.dtpage.offset <= p && p < (this.dtpage.offset + parseInt(this.selectPagination))) {
            this.locationPagings.push(this.locationDisplay[p]);
          }
        }
      }
    } else {
      for (let p = 0; p < this.locationDisplay.length; p++) {
        if (this.dtpage.offset <= p && p < (this.dtpage.offset + parseInt(this.selectPagination))) {
          this.locationPagings.push(this.locationDisplay[p]);
        }
      }
    }
  }
}

export default angular
  .module('app.location-group.controller', ['agGrid', 'app.directive.select2', 'ngJoyRide'])
  .controller('LocationGroupCtrl', LocationGroupCtrl);
