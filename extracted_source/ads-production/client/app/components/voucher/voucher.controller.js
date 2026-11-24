import moment from 'moment';
import _findIndex from 'lodash/findIndex';
import _forEach from 'lodash/forEach';
import _groupBy from 'lodash/groupBy';
import _uniqBy from 'lodash/uniqBy';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _pick from 'lodash/pick';
import gridCellActionTemplate from './grid.cell-action.pug';
import '../banner/banner.less';
import printVoucher from './printVoucher';
const getRandomCode = (type, length) =>{
    let text = "";
    let possible = {
        number: "0123456789",
        alphabet: "abcdefghijklmnopqrstuvxyz",
        mix: "abcdefghijklmnopqrstuvxyz0123456789"
    };

    if(length%2){
        for (let i = 0; i < length; i++)
            text += possible[type].charAt(Math.floor(Math.random() * possible[type].length));
    } else {
        for (let i = 0; i < length/2; i++)
            text += possible[type].charAt(Math.floor(Math.random() * possible[type].length));
        text +='-';
        for (let i = 0; i < length/2; i++)
            text += possible[type].charAt(Math.floor(Math.random() * possible[type].length));
    }
    return text;
};

class VoucherCtrl {
  constructor(LoopBackResource, $window, alertify, AppConfig, Messages, Voucher, Device, currentUser, vouchers, locations) {
    this.LoopBackResource = LoopBackResource;
    this.$window = $window;

    this.alertify = alertify;
    this.Messages = Messages;
    this.AppConfig = AppConfig;
    this.Voucher = Voucher;
    this.Device = Device;

    this.currentUser = currentUser;
    this.vouchers = vouchers;
    this.locationMap = {};
    locations.forEach((item) => {
        this.locationMap[item.id] = item.name;
    });
    this.obj = {};
    this.mode = 'statistic';
    this.viewHeight = window.innerHeight;

    this.initFilter();
    this.initGrid();
    this.charts = {use: {}, expire: {}};
    this.refresh(true);
  }


  currentTime() {
    return moment().valueOf();
  }
  chartInitialized(type, chartName, hook){
    this.charts[type][chartName].hook = hook;
    this.charts[type][chartName].instance = hook.instance;
  }
  renderNamedVoucher(){
      this.voucherNamed = _groupBy(this.vouchers, 'name');
      let that = this;
        _forEach(this.voucherNamed, (dat, name)=>{
            if(!this.charts.use[name]){
                this.charts.use[name] = {
                  type: 'pie',
                  name: ' ',
                  dataPath: 'tracking.newReturn',
                  chartOptions: require('./chart-config-pie'),
                  onInitialized: this.chartInitialized.bind(this, 'use', name),
                  percentage: false,
                  series: { Use: { name: 'Use' },  Unused: { name: 'Unused' } },
                };
                this.charts.expire[name] = {
                  type: 'pie',
                  name: ' ',
                  dataPath: 'tracking.newReturn',
                  chartOptions: require('./chart-config-pie'),
                  onInitialized: this.chartInitialized.bind(this, 'expire', name),
                  percentage: false,
                  series: {Unexpired: { name: 'Unexpired' }, Expired: { name: 'Expired' }}
                };
            }
        });
        setTimeout(()=>{
          _forEach(this.voucherNamed, (dat, name)=>{
            if(this.charts.use[name].hook){
              this.charts.use[name].hook.updateData([{name: "", detail: [{name: "Use", y: dat.filter(vou=>vou.status).length}, {name: "Unused", y: dat.filter(vou=>!vou.status).length}]}]);
              this.charts.expire[name].hook.updateData([{name: "", detail: [{name: "Unexpired", y: dat.filter(vou=>!vou.expiredAt || vou.expiredAt>this.currentTime()).length}, {name: "Expired", y: dat.filter(vou=>vou.expiredAt && vou.expiredAt<this.currentTime()).length}]}]);
            }
          });
        }, 200);
  }
  getUsed(){
      return this.vouchers.filter(vou=>vou.status).length;
  }
  getUnexpired(){
      return this.vouchers.filter(vou=>!vou.expiredAt || vou.expiredAt>this.currentTime()).length;
  }
  getExpired(){
      return this.vouchers.filter(vou=>vou.expiredAt && vou.expiredAt<this.currentTime()).length;
  }
  getCurrent(type){
      return this.vouchers.filter(vou=>vou.updatedAt>moment().startOf(type).valueOf()).length;
  }
  initFilter() {
    this.filters = [];
    this.filter = {
      all: [
        { headerName: 'Name', field: 'name', filter: 'text', },
        { headerName: 'Expired at', field: 'expiredAt', filter: 'date', },
        { headerName: 'Quota', field: 'quota', filter: 'select',
          selectOptions: [
              {id: 0, text: 'Unlimited'},
              {id: 1, text: 'One device'},
              {id: 2, text: 'Multi devices'},
          ],
        },
      ],
      selectOptions: { width: '100%', placeholder: 'Pick a value', data: [], },
    };
    this.setCurrentFilter = (filter) => {
      this.filter.current = filter;

      if (filter.filter === 'select') {
        this.filter.selectOptions.data = filter.selectOptions;
      }

      this.filter.value = null;
    };

    this.addCurrentFilter = () => {
        console.log('addCurrentFilter', this.filter);
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
        value: this.filter.value,
      };

      // Set filter text
      if (this.filter.current.filter === 'select') {
        const option = this.filter.current.selectOptions.find(
          item => item.id === filter.value,
        );
        if (option) {
          filter.text = option.text;
        }
        if(this.filter.current.field === 'quota'){
            filter.value = Number(filter.value);
        }
      } else if (this.filter.current.filter === 'date') {
        filter.text = filter.value
          .map(item => moment(item).format('MMM DD, YYYY'))
          .join(' - ');
      }
      filter.text = filter.text || filter.value;

      this.filters.push(filter);
      this.gridApi.onFilterChanged();
    };

    this.removeFilter = (index) => {
      const filter = this.filters[index].field;
      this.filters.splice(index, 1);

      this.gridApi.onFilterChanged();
    };

    this.toggleFilter = (index) => {
      this.filters[index].disabled = !this.filters[index].disabled;

      this.gridApi.onFilterChanged();
    };
  }

  buildChildFilter(field, value) {
    if (field === 'expiredAt') {
      const filter = { [field]: {} };
      if (!Array.isArray(value)) {
        value = [value];
      }
      if (value[0]) {
        filter[field].gte = moment(value[0]).valueOf();
      }
      if (value[1]) {
        filter[field].lte = moment(value[1]).valueOf();
      }

      return filter;
    }

    if (field === 'quota' && value>1){
        const filter = { [field]: {} };
        filter[field].gte = 2;
        return filter;
    }

    if (field === 'name' && value){
        const filter = { [field]: {} };
        filter[field].regexp = '^(?=.*?('+value+')).*$';
        return filter;
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
    if(this.currentUser.profileName !== 'superadmin'){
        filters["createdBy"] = [{value: this.currentUser.id}];
    }
    filters = Object.keys(filters).map((field) => {
      if (filters[field].length === 1) {
        return this.buildChildFilter(field, filters[field][0].value);
      }
      return {
        or: filters[field].map(item =>
          this.buildChildFilter(field, item.value),
        ),
      };
    });
    if(filters.length){
        return { where: { and: filters } };
    } else {
        return { where: {  } };
    }
  }

  initGrid() {
    this.gridDatasource = {
      getRows: ({ request, successCallback, failCallback }) => {
        if (request.startRow > 1000) {
          return failCallback();
        }

        const filter = {
          ...this.buildFilters(),
          offset: request.startRow,
          limit: request.endRow - request.startRow,
        };

        if (request.sortModel.length) {
          filter.order = request.sortModel.map(
            item => `${item.colId} ${item.sort.toUpperCase()}`,
          );
        }

        return this.Voucher
          .find({ filter })
          .$promise.then((vouchers) => {
            successCallback(vouchers.map(item=>item), vouchers.length);
          })
          .catch(failCallback);
      },
    };
    let that = this;
    this.gridOptions = {
      columnDefs: [
        {
          headerName: 'No',
          field: '',
          width: 100,
          suppressSorting: true,
          checkboxSelection: true,
          cellRenderer: params => params.rowIndex + 1,
        },
        {headerName: 'Code', field: 'code', width: 150},
        {headerName: 'Name', field: 'name', width: 200},
        {
            headerName: 'Status',
            field: 'quota',
            width: 150,
            cellClass: 'text-center',
            cellRenderer: (params) => {
              switch (params.value) {
                case 0:
                  return 'Valid for multi-devices (unlimited)';
                case 1:
                  return 'Valid for one-device use';
                default:
                  return 'Valid for multi-devices ('+params.value+' usages)';
              }
            },
          },
        {
            headerName: 'Download',
            field: 'download',
            width: 100,
            cellClass: 'text-center',
            cellRenderer: (params) => {
              return params.value?params.value+' Kbps':'-'
            },
          },
        {
            headerName: 'Upload',
            field: 'upload',
            width: 100,
            cellClass: 'text-center',
            cellRenderer: (params) => {
              return params.value?params.value+' Kbps':'-'
            },
          },
        {
            headerName: 'Byte Quota',
            field: 'byte',
            width: 100,
            cellClass: 'text-center',
            cellRenderer: (params) => {
              return params.value?params.value+' MB':'-'
            },
          },
          {
            headerName: 'Created By',
            field: 'createdBy',
            width: 100,
            cellRenderer: params => (params && params.data) ? (params.data.createdByUsername || '') : '',
            // sort: 'desc',
          },
          {
            headerName: 'Created At',
            field: 'createdAt',
            width: 150,
            cellRenderer: params =>
              moment(params.value).format('MMM DD, YYYY HH:mm'),
            // sort: 'desc',
          },
          {
            headerName: 'Expired At',
            field: 'expiredAt',
            width: 150,
            cellStyle: params => params.value<this.currentTime()?{color: 'red'}:null,
            cellRenderer: params =>
              params.value?moment(params.value).format('MMM DD, YYYY HH:mm'):'Unused',
            // sort: 'desc',
          },
          {
              headerName: 'Actions',
              field: '',
              suppressSorting: true,
              minWidth: 100,
              maxWidth: 100,
              cellClass: 'overflow-visible',
              cellClass: 'text-center',
              template: gridCellActionTemplate,
          },
      ],
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      context: this,
      enableColResize: true,
      angularCompileRows: true,

      rowModelType: 'enterprise',
      // filter and sort
      enableSorting: true,
      // enableFilter: true,

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
      onSelectionChanged: (ev)=> {
          if(this.gridApi.getSelectedRows().length){
              document.getElementById('exportBtn').removeAttribute('disabled');
              document.getElementById('printBtn').removeAttribute('disabled');
          } else {
              document.getElementById('exportBtn').setAttribute('disabled', true);
              document.getElementById('printBtn').setAttribute('disabled', true);
          }
      }
    };

    this.gridOptionsDetail = {
        columnDefs: [
          {
            headerName: 'No',
            field: '',
            width: 60,
            suppressSorting: true,
            cellRenderer: params => params.rowIndex + 1,
          },
          {headerName: 'Code', field: 'code', width: 140},
          {headerName: 'Name', field: 'name', width: 150},
          {
              headerName: 'Location', field: 'location', width: 190,
              cellRenderer: params =>
                params.value?this.locationMap[params.value]:"",
          },
          {
              headerName: 'Login', field: 'loginTime', width: 170,
              cellRenderer: params =>
                params.value?moment(params.value).format('MMM DD, YYYY HH:mm'):"",
          },
          {headerName: 'Mac', field: 'mac', width: 160},
          {
              headerName: 'User', field: 'source', width: 200,
              cellRenderer: params => {
                  let srcDev = params.value;
                  if(srcDev){
                      if(srcDev.fb){
                          return `<img class="img-circle img-xs"
                            src="https://graph.facebook.com/v2.9/${srcDev.fb.fbId}/picture">
                            <a target="_blank"
                              href="https://facebook.com/${srcDev.fb.fbId}">
                              ${srcDev.fb.fbName}</a>`
                      }
                      if(srcDev.google){
                          return srcDev.google.email;
                      }
                      if(srcDev.audience){
                          return srcDev.audience.email || srcDev.audience.name;
                      }
                  }
                  return '';
              }
          },
          {
              headerName: 'Data', field: 'totalData', width: 100,
              cellRenderer: params =>
                params.value?Math.ceil(params.value/1024/1024) + "MB":"",
          },
          {
              headerName: 'Stop', field: 'logoutTime', width: 170,
              cellRenderer: params =>
                params.value?moment(params.value).format('MMM DD, YYYY HH:mm'):"",
          },
        ],
        context: this,
        enableColResize: true,
        angularCompileRows: true,

        // filter and sort
        enableSorting: true,
        // enableFilter: true,

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
        onGridReady: (ev)=>{
            this.gridDetailApi = ev.api;
        }
    };
  }

  onGridReady(event) {
    this.gridApi = event.api;
    this.gridApi.setEnterpriseDatasource(this.gridDatasource);
  }

  onAction(action, row) {
    switch (action) {
      case 'new':
      case 'edit':
      case 'delete':
      case 'print':
      case 'selectAll':
      case 'refresh':
        this[action](row);
        break;
      default:
        break;
    }
  }

  new() {
    this.obj = {
        number: 10,
        quota: "1",
        quotaNum: 2,
        expireFromUse: false,
        expire: "86400000",
        expireNum: 1,
        expireType: 'days',
        download: 0,
        upload: 0,
        byte: 0,
        name: '',
        createdBy: this.currentUser.id,
        length: 10,
        prefix: '',
        type: 'number'
    };
    setTimeout(()=>{
        $('[data-toggle="popover"]').popover({
            trigger: 'hover',
            placement: "top"
        });
    }, 200);
  }

  create(){
      let { number, quota, quotaNum, expireFromUse, expire, expireNum, expireType, download, upload, byte, name, createdBy, length, prefix, type } = this.obj;
      if(!number){
          this.alertify.error('Require number of vouchers');
          return ;
      }
      if(length < 5){
          this.alertify.error('Voucher length at least 5!');
          return ;
      }
      if(number <1 || number !== Math.floor(number)){
          this.alertify.error('Wrong number of vouchers');
          return ;
      }
      if(quota === "2" && (quotaNum <2 || quotaNum !== Math.floor(quotaNum)) ){
          this.alertify.error('Wrong number of usages');
          return ;
      }
      if(expire === "0" && (expireNum < 1 || expireNum !== Math.floor(expireNum))){
          this.alertify.error('Wrong number of Expiration Time');
          return ;
      }
      let createArr = [], currentTime = moment().valueOf();
      for (let i=0;i<number;i++){
          let expireTime = expire==="0"?moment(currentTime).add(expireNum, expireType).valueOf() - currentTime:Number(expire);
          createArr.push({
              code: (prefix||"")+getRandomCode(type, length),
              quota: quota==="2"?quotaNum:Number(quota),
              expireTime: expire==="0"?moment(currentTime).add(expireNum, expireType).valueOf() - currentTime:Number(expire),
              expiredAt: expireFromUse?0:currentTime+expireTime,
              download, upload, byte,
              name: name.toUpperCase(),
              createdAt: currentTime,
              createdBy
          });
      }
      this.Voucher.createMany(createArr)
          .$promise.then((savedObj) => {
            this.alertify.success(this.Messages.createSuccess);
            this.refresh(true);
            $('#fmEdit').modal('hide');
          })
          .catch(() => {
            this.alertify.error(this.Messages.createFailed);
        });
  }

  delete(row){
      this.alertify.confirm(this.Messages.confirmDelete.format(`voucher ${row.code}`), () => {
        this.Voucher
          .deleteById({ id: row.id }).$promise
          .then(() => {
            this.alertify.success(this.Messages.deleteSuccess);
            this.gridApi.onFilterChanged();
          }).catch(() => {
            this.alertify.error(this.Messages.createFailed);
          });
      }, () => {
        this.alertify.log('You cancelled');
      });
  }

  refresh(ignore) {
      if(this.gridApi){
          this.gridApi.onFilterChanged();
      }
    let query = {};
    if(this.currentUser.profileName !== 'superadmin'){
        query = {where: {"createdBy": this.currentUser.id}, order: 'createdAt DESC'};
    }
    this.Voucher
      .find({filter: query}).$promise
      .then((vouchers) => {
        this.vouchers = vouchers;
        this.renderNamedVoucher();
        this.obj = {};
        if(!ignore){this.alertify.success(this.Messages.refreshSuccess);}
      });

  }

  exportVoucher(){
      let selectedRows = this.gridApi.getSelectedRows();
      if(!selectedRows.length){
        this.alertify.alert('Please select voucher to export!');
        return ;
      }
      setTimeout(()=>{
          const rows = [["No", "Code", "Name", "Status", "Download", "Upload", "Byte Quota", "Expired At"]];
          selectedRows.forEach((item, idx)=>{
              rows.push([idx+1,
                  item.code, item.name,
                  item.quota===0?'Valid for multi-use (unlimited)':item.quota===1?'Valid for Single device use':'Valid for multi devices ('+item.quota+' usages)',
                  item.download?item.download+' Kbps':'-',
                  item.upload?item.upload+' Kbps':'-',
                  item.byte?item.byte+' MB':'-',
                  moment(item.expiredAt).format('MMM DD YYYY HH:mm')
              ]);
          });
          let csvContent = "data:text/csv;charset=utf-8,";
          rows.forEach(function(rowArray){
              csvContent += rowArray.join(",") + "\r\n";
          });
          let encodedUri = encodeURI(csvContent);
          let link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "Vouchers.csv");
          document.body.appendChild(link);
          link.click();
      }, 500);
  }

  printVoucher(){
      let selectedRows = this.gridApi.getSelectedRows();
      if(!selectedRows.length){
        this.alertify.alert('Please select voucher to print!');
        return ;
      }
      printVoucher.PrintThermal(selectedRows);
  }

  print(row){
      console.log(row);
      printVoucher.PrintThermal([row]);
  }

  selectAll(val){
      this.gridApi.forEachNode((node, idx)=>{
          node.setSelected(val);//setSelected selectThisNode
      });
  }

  onChangeView(mode){
      this.mode = mode;
      if(mode==='statistic'){
          this.refresh(true);
      }
  }

  voucherDetail(){
      let queryMac = {}, renderData = [], lastLogin, lastLogout;
      let currentHour = moment().subtract(1, 'hour').valueOf();
      this.vouchers.filter(vou=>vou.updatedAt>currentHour).forEach((vou)=>{
          if(vou.loggedIn){
              _forEach(vou.loggedIn, (mac, key)=>{
                  queryMac[key] = 1;

                  lastLogin = null;
                  lastLogout = null;
                  mac.history.forEach((his)=>{
                      if(his.action==='login' && his.time>currentHour){
                          lastLogin = his;
                      } else if(his.action==='logout'){
                          lastLogout = his;
                      }
                  });
                  if(lastLogin){
                      renderData.push({
                          code: vou.code,
                          name: vou.name,
                          mac: key,
                          location: lastLogin.locationId,
                          totalData: mac.totalData,
                          loginTime: lastLogin.time,
                          logoutTime: lastLogout?lastLogout.time:null
                      });
                  }
              });
          }
      });
      this.Device.find({filter: {where: {mac:{inq: _map(queryMac, (__, key)=>key)}}, fields: {mac: true, fb: true, google: true, audience: true}}}).$promise
      .then((data)=>{
          data.forEach((item)=>{
              queryMac[item.mac] = item;
          });
          renderData = renderData.map((item)=>{
              item.source = queryMac[item.mac];
              return item;
          });
          this.gridDetailApi.setRowData(renderData);
      });
  }
}
export default angular
  .module('app.voucher.controller', [
      'agGrid',
      'app.directive.select2',
      'app.directive.dateRangePicker',
      'app.directive.highchart',
      require('./chart-config').name,
  ])
  .controller('VoucherCtrl', VoucherCtrl);
