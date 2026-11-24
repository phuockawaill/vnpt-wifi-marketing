/* eslint-disable no-confusing-arrow */
import _findIndex from 'lodash/findIndex';
import gridCellActionTemplate from './grid.cell-action.pug';
import _filter from 'lodash/filter';
import moment from 'moment';

class AccountCtrl {
  constructor($state, $rootScope, alertify, Messages, VNMessages, User, profiles, accounts, campaigns, Campaign, currentUser) {
    const removeModalBackdrop = angular.element(document.querySelectorAll('.modal-backdrop'));
    for (let i = 0; i < removeModalBackdrop.length; i++) {
      angular.element(removeModalBackdrop[i]).remove();
    }

    this.$state = $state;
    this.$rootScope = $rootScope;
    this.currentUser = currentUser;
    this.alertify = alertify;
    this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;

    this.User = User;
    this.Campaign = Campaign;

    this.originProfiles = profiles;
    this.profiles = profiles;
    if (currentUser.profileName !== 'superadmin') {
      if (currentUser.profileName === 'admin') {
        this.profiles = _filter(profiles, pro => pro.name === 'brand' || pro.name === 'client' || pro.name === 'publisher');
      } else if (currentUser.profileName === 'client') {
        this.profiles = _filter(profiles, pro => pro.name === 'brand');
      } else if (currentUser.profileName === 'publisher') {
        this.profiles = _filter(profiles, pro => pro.name === 'brand');
      }
    }
    this.profileMap = {};
    this.profileKey = {};
    this.profileSelect = profiles.map((p) => {
      this.profileMap[p.name] = p.description;
      this.profileKey[p.id] = p.name;
      return { value: p.description, label: p.description };
    });
    this.accounts = accounts.map((item) => {
      item.profileDescription = this.profileMap[item.profileName];
      if (item.profileName === 'client' && item.options && item.options.trial) {
        item.profileDescription = 'Trial';
      }
      return item;
    });
    this.obj = {};
    this.accountMap = {};
    this.objKey = {};
    campaigns.forEach((camp) => {
      if (!this.accountMap[camp.brandId]) {
        this.accountMap[camp.brandId] = [{ name: camp.name, id: camp.id }];
      } else {
        this.accountMap[camp.brandId].push({ name: camp.name, id: camp.id });
      }
    });
    this.viewHeight = window.innerHeight;
    this.initGrid();
    this.initJoyRide();
  }

  initJoyRide() {
    setTimeout(() => {
      this.guidance = (this.$state.params && this.$state.params.guidance) ? this.$state.params.guidance : false;
      if (this.guidance) {
        this.startJoyRideAccount = true;
      } else {
        this.startJoyRideAccount = false;
      }

      this.joyrideConfigAccount = [
        {
          type: "element",
          selector: "#joyride-create-account",
          heading: "Brand Account",
          text: "This page shows <b>Brand Accounts</b>. You can provide name, username, email and password options.",
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
    }, 50);
  }

  joyrideFinish(type) {
    if (type === 'skip') {
      this.startJoyRideAccount = false;
      this.$rootScope.createdGuidance = 'closed';
      return;
    }
    return this.$state.go('admin.campaign', { guidance: true, created: moment().valueOf() });
  }

  initNewObj() {
    $('#fmEdit').modal();
    this.startJoyRideAccount = false;
    this.obj = { createdBy: this.currentUser.id, maxUploadSize: 10 };
    if (this.currentUser.profileName === 'client' || this.currentUser.profileName === 'publisher') {
      this.obj.profileId = this.profiles[0] ? this.profiles[0].id : '';
    }
    if (this.currentUser.profileName === 'client' && this.currentUser.options && this.currentUser.options.trial && this.accounts.length > 2) {
      this.alertify.error('You are not allow!');
      setTimeout(() => {
        $('#fmEdit').modal('hide');
      }, 200);
    }
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
        headerName: this.$rootScope.isLang === 'VN' ? 'Tên' : 'Name',
        field: 'name',
        width: 200,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Tên đăng nhập' : 'Username',
        field: 'username',
        width: 120,
      },
      {
        headerName: 'Email',
        field: 'email',
        width: 300,
      },
      {
        headerName: this.$rootScope.isLang === 'VN' ? 'Loại tài khoản' : 'Account Type',
        field: 'profileDescription',
        width: 200,
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
        maxWidth: 240,
        minWidth: 240,
        cellClass: 'overflow-visible',
        template: gridCellActionTemplate,
      },
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

  closeModal() {
    this.$rootScope.createdGuidance = 'closed';
  }

  onGridData() {
    this.gridApi.setRowData(this.accounts);
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  onAction(action, row) {
    switch (action) {
      case 'edit':
      case 'delete':
      case 'refresh':
      case 'getClientkey':
        this[action](row);
        break;
      default:
        break;
    }
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.accounts.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.accounts, item => item.id === oldRow.id);
      if (newRow) {
        this.accounts.splice(idx, 1, newRow);
      } else {
        this.accounts.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  edit(row) {
    this.obj = { ...row };
    delete this.obj.$promise;
    delete this.obj.$resolved;
    if (this.currentUser.profileName === 'client' && this.currentUser.options && this.currentUser.options.trial && this.obj.id === this.currentUser.id) {
      this.alertify.error('You are not allow!');
      setTimeout(() => {
        $('#fmEdit').modal('hide');
      }, 200);
    }
  }

  create(validForm) {
    if (!validForm) {
      if (this.fmEdit.username) {
        this.fmEdit.username.$setDirty();
        this.fmEdit.username.$validate();
      }

      if (this.fmEdit.email) {
        this.fmEdit.email.$setDirty();
        this.fmEdit.email.$validate();
      }

      if (this.fmEdit.password) {
        this.fmEdit.password.$setDirty();
        this.fmEdit.password.$validate();
      }

      if (this.fmEdit.passwordConfirmation) {
        this.fmEdit.passwordConfirmation.$setDirty();
        this.fmEdit.passwordConfirmation.$validate();
      }

      return;
    }

    const profileName = _findIndex(
      this.profiles,
      p => p.id === this.obj.profileId,
    );
    if (this.currentUser.profileName !== 'client' && this.currentUser.profileName !== 'publisher' && this.currentUser.profileName !== 'brand') {
      this.obj.profileName = this.profiles[profileName].name;
    }
    const findProfileName = this.originProfiles.find(item => item.id === this.obj.profileId);
    this.obj.type = (findProfileName && findProfileName.name && findProfileName.name === 'admin') ? 1 : 0;
    this.obj.profileName = (findProfileName && findProfileName.name) ? findProfileName.name : '';

    if (this.obj.id) {
      delete this.obj.profileDescription;
      this.User
        .replaceById(this.obj)
        .$promise.then((savedObj) => {
          savedObj.profileDescription = this.profileMap[savedObj.profileName];
          this.alertify.success(this.Messages.updateSuccess);
          this.updateRow(this.obj, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.updateFailed);
        })
        .finally(() => {
          this.passwordConfirmation = undefined;
        });
    } else {
      this.obj.rootdir = this.obj.profileName === 'superadmin' ? '/' : `/${this.obj.username}`;
      this.User
        .create(this.obj)
        .$promise.then((savedObj) => {
          savedObj.profileDescription = this.profileMap[savedObj.profileName];
          this.alertify.success(this.Messages.createSuccess);
          this.updateRow(null, savedObj);
          this.edit(savedObj);
          $('#fmEdit').modal('hide');
        })
        .catch(() => {
          this.alertify.error(this.Messages.createFailed);
        })
        .finally(() => {
          this.passwordConfirmation = undefined;
          setTimeout(() => {
            if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
              return this.$state.go('admin.campaign', { guidance: true, created: moment().valueOf() });
            }
          }, 50);
        });
    }
  }

  delete(row) {
    let haveCampaign = this.accountMap[row.id] ? true : false;
    let messages;
    if (this.currentUser.profileName === 'client' && this.currentUser.options && this.currentUser.options.trial && this.currentUser.id === row.id) {
      this.alertify.error('You are not allow!');
      // setTimeout(() => {
      //   $('#fmEdit').modal('hide');
      // }, 200);
      return;
    }
    if (haveCampaign) {
      messages = this.Messages.confirmInvalidCampaign.format(`user ${row.username}`, this.accountMap[row.id].map(({ name }) => name).toString());
    } else {
      messages = this.Messages.confirmDelete.format(`user ${row.username}`);
    }
    this.alertify.confirm(messages,
      () => {
        this.User
          .deleteById({ id: row.id })
          .$promise.then(() => {
            if (haveCampaign) {
              Promise.each(this.accountMap[row.id], (camp) => {
                this.Campaign.updateAll({ where: { id: camp.id } }, { status: 'invalid' });
              }).catch(() => this.alertify.error('Update campaign failed!'));
            }
            this.updateRow(row);
            this.alertify.success(this.Messages.deleteSuccess);
          })
          .catch((err) => {
            this.alertify.error(err.data.message || this.Messages.deleteFailed);
          });
      },
      () => {
        this.alertify.log('You cancelled');
      },
    );
  }

  refresh() {
    let query = {};
    const mapData = (users, campaigns) => {
      campaigns.then((camps) => {
        this.accountMap = {};
        camps.forEach((camp) => {
          if (!this.accountMap[camp.brandId]) {
            this.accountMap[camp.brandId] = [{ name: camp.name, id: camp.id }];
          } else {
            this.accountMap[camp.brandId].push({ name: camp.name, id: camp.id });
          }
        });
      });

      users.then((accounts) => {
        this.accounts = accounts.map((item) => {
          item.profileDescription = this.profileMap[item.profileName];
          if (item.profileName === 'client' && item.options && item.options.trial) {
            item.profileDescription = 'Trial';
          }
          return item;
        });
        this.onGridData();
        this.obj = {};

        this.alertify.success(this.Messages.refreshSuccess);
      });
    };
    if (this.currentUser.profileName === 'admin') {
      this.User.find().$promise
        .then(users => mapData(
          this.User.find().$promise,
          this.Campaign.find({
            filter: {
              where: {
                or: [
                  { createdBy: this.currentUser.id },
                  ...users.map(usr => ({ createdBy: usr.id })),
                ]
              }
            }
          }).$promise,
        ));
    } else {
      if (this.currentUser.profileName !== 'superadmin') {
        query = { where: { or: [{ createdBy: this.currentUser.id }, { _id: this.currentUser.id }] } };
      }
      mapData(
        this.User.find().$promise,
        this.Campaign.find({ filter: query }).$promise,
      );
    }
  }

  getClientkey(row) {
    this.User
      .getClientkey({ userId: row.id })
      .$promise.then((res) => {
        $('#fmKey').modal();
        this.objKey = Object.assign({}, res.keyObj, { username: row.username });
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

export default angular
  .module('app.account.controller', ['agGrid', 'ngJoyRide'])
  .controller('AccountCtrl', AccountCtrl);
