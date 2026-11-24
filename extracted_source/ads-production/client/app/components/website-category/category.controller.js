import _findIndex from 'lodash/findIndex';
import gridCellActionTemplate from './grid.cell-action.pug';

class CategoryCtrl {
  constructor(LoopBackResource, $window, alertify, Messages, SelectOption, categories, currentUser) {
    this.LoopBackResource = LoopBackResource;
    this.$window = $window;

    this.alertify = alertify;
    this.Messages = Messages;

    this.Category = SelectOption;

    this.categories = categories;
    this.currentUser = currentUser;
    this.obj = {};
    this.viewHeight = window.innerHeight;
    this.trialUser = currentUser.profileName === 'client' && currentUser.options && currentUser.options.trial;

    this.initGrid();
  }

  initGrid() {
    this.columnDefs = [
      {
        headerName: 'No',
        field: '',
        width: 50,
        suppressSorting: true,
        cellRenderer: params => params.rowIndex + 1,
      },
      { headerName: 'Name', field: 'text', minWidth: 80 },
      { headerName: 'Key', field: 'value', minWidth: 80 },
      { headerName: 'RegExp String', field: 'options.regexp', minWidth: 200 },
      {
        headerName: 'Actions',
        field: '',
        suppressSorting: true,
        minWidth: 100,
        maxWidth: 100,
        cellClass: 'overflow-visible text-center',
        hide: this.currentUser.profileName !== 'superadmin',
        template: gridCellActionTemplate,
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
    this.gridApi.setRowData(this.categories);
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.onGridData();
  }

  updateRow(oldRow, newRow) {
    if (!oldRow && newRow) {
      this.categories.splice(0, 0, newRow);
    } else {
      const idx = _findIndex(this.categories, item => item.id === oldRow.id);
      if (newRow) {
        this.categories.splice(idx, 1, newRow);
      } else {
        this.categories.splice(idx, 1);
      }
    }
    this.onGridData();
  }

  onAction(action, row) {
    switch (action) {
      case 'new':
      case 'edit':
      case 'refresh':
        this[action](row);
        break;
      default:
        break;
    }
  }

  new() {
    this.obj = { type: 'website_category', createdBy: this.currentUser.id, options:{regexp: ''}};
  }

  edit(row) {
    this.obj = { ...row };
    delete this.obj.$promise;
    delete this.obj.$resolved;
  }

  create() {
    if (this.obj.id) {
      this.Category.replaceById(this.obj).$promise
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
      this.obj.value = this.obj.text.latinize().replace(/[^\w]/g, '').toLowerCase();
      this.Category.create(this.obj).$promise
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

  refresh() {
    let query = { where: { type: 'website_category' }};
    // if(this.currentUser.profileName !== 'superadmin'){
    //   query.where = Object.assign({}, query.where, {"createdBy": this.currentUser.id});
    // }
    this.Category
      .find({ filter: query }).$promise
      .then((categories) => {
        this.categories = categories;
        this.onGridData();
        this.obj = {};

        this.alertify.success(this.Messages.refreshSuccess);
      });
  }
}

export default angular
  .module('app.website-category.controller', ['agGrid'])
  .controller('CategoryCtrl', CategoryCtrl);
