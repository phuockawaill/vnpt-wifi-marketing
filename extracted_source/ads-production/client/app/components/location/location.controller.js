import Papa from 'papaparse';
import moment from 'moment';
import _findIndex from 'lodash/findIndex';
import _cloneDeep from 'lodash/cloneDeep';
import './location.less';
import gridCellActionTemplate from './grid.cell-action.pug';
// import gridCellActionApTemplate from './grid.cell-action-ap.pug';
import gridCellCampaignTemplate from './grid.cell-campaign.pug';
import gridCellApTemplate from './grid.cell-ap.pug';
import ApActionRender from './ag-action-render';

const regexMAC = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;

class LocationCtrl {
    constructor($window, $scope, $rootScope, $state, alertify, AuthEvents, User, Messages, VNMessages, Location, SelectOption, locations, Campaign, campaigns, locationGroups, currentUser, CommonData) {
        const removeModalBackdrop = angular.element(document.querySelectorAll('.modal-backdrop'));
        for (let i = 0; i < removeModalBackdrop.length; i++) {
            angular.element(removeModalBackdrop[i]).remove();
        }
        this.$window = $window;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$state = $state;

        this.alertify = alertify;
        this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;
        this.User = User;
        this.Location = Location;
        this.LocationGroup = SelectOption;
        this.Campaign = Campaign;

        this.locations = locations;
        this.locationGroups = locationGroups;
        this.currentUser = currentUser;

        this.importModal = undefined;
        this.loadingImport = false;
        this.importSuccess = false;

        this.importCSVMode = false;
        this.importCSVErr = false;
        this.addApToExists = false;
        this.ap = {};
        this.apList = [];
        this.readingCSV = false;
        this.objExpand = {};
        this.selectCity = {
            width: '100%',
            placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn thành phố/tỉnh' : 'Pick a city/province',
            data: []
        };
        this.selectDistrict = {
            width: '100%',
            placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn quận/huyện' : 'Pick a district',
            data: []
        };
        this.selectNetwork = {
            width: '100%',
            placeholder: this.$rootScope.isLang === 'VN' ? 'Chọn Wifi Network' : 'Pick a Wifi Network',
            data: locationGroups.map(({ text, id }) => ({ text, id }))
        };
        this.hotspotTypes = [
            { id: 'default', name: 'Genex' },
            { id: 'xirrus', name: 'Xirrus Standalone' },
            { id: 'pfsense', name: 'pfSense' }
        ];
        this.viewHeight = window.innerHeight;
        CommonData.cities().then((cities) => {
            this.cities = cities;
            this.updateLocation();
            this.selectCity.data = this.cities;
        });

        this.initForm();
        this.initGrid();
        this.initJoyRide();
        this.locationMap = {};
        this.campaignMap = {};
        campaigns.forEach((camp) => {
            if (camp.locations) {
                camp.locations.forEach((loc) => {
                    if (!this.locationMap[loc.locationId]) {
                        this.locationMap[loc.locationId] = [{ name: camp.name, id: camp.id, isCatfish: camp.isCatfish }];
                    } else {
                        this.locationMap[loc.locationId].push({ name: camp.name, id: camp.id, isCatfish: camp.isCatfish });
                    }
                });
            }
            this.campaignMap[camp.id] = camp;
        });
        this.trialUser = currentUser.profileName === 'client' && currentUser.options && currentUser.options.trial;
    }

    initJoyRide() {
        setTimeout(() => {
            this.guidance = (this.$state.params && this.$state.params.guidance) ? this.$state.params.guidance : false;
            if (this.guidance) {
                this.startJoyRideLoc = true;
            } else {
                this.startJoyRideLoc = false;
            }

            this.joyrideConfigLoc = [
                {
                    type: 'element',
                    selector: '#joyride-create-location',
                    heading: 'Location',
                    text: 'This page shows your <b>location</b> which you provide. You can change your location name, city, district and address options.',
                    placement: 'left',
                    scroll: true,
                    elementTemplate: content => `
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
                    `
                }
            ];
        }, 50);
    }

    joyrideFinish(type) {
        if (type === 'skip') {
            this.startJoyRideLoc = false;
            this.$rootScope.createdGuidance = 'closed';
            return;
        }
        return this.$state.go('admin.location-group', { guidance: true, created: moment().valueOf() });
    }

    initForm() {
        this.selectCityChange = () => {
            if (!this.obj.cityId) {
                return;
            }
            const foundCityDistrict = this.cities.find(ct => ct.id === this.obj.cityId);
            this.districts = foundCityDistrict.options && foundCityDistrict.options.district ? foundCityDistrict.options.district : [];
            this.districts.map((d) => {
                d.id = d.value;
                return d;
            });
            this.selectDistrict.data = this.districts;
            const foundDistrict = this.districts.find(d => d.value === this.obj.districtId);
            if (foundDistrict) {
                this.obj.districtId = this.obj.districtId;
            } else {
                delete this.obj.districtId;
            }
        };

        this.fmCampaignDragulaOptions = {
            onDrop: (el, _1, _2, sib) => {
                const sourceId = el.dataset.dragulaId;
                const destId = (sib && sib.dataset.dragulaId);

                const sourceIdx = _findIndex(this.camObj, item => item.campaignId === sourceId);
                const source = this.camObj.splice(sourceIdx, 1)[0];

                const destIdx = destId ? _findIndex(this.camObj, item => item.campaignId === destId) : this.camObj.length;
                this.camObj.splice(destIdx, 0, source);
            }
        };
    }

    initGrid() {
        const that = this;
        this.columnDefs = [
            {
                headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
                field: '',
                width: 80,
                suppressSorting: true,
                cellRenderer: params => params.rowIndex + 1
            },
            {
                headerName: 'No.',
                field: 'idx',
                suppressSorting: true,
                hide: true
            },
            {
                headerName: 'Location', field: 'locName', hide: true
            },
            {
                headerName: 'AP Mac List', field: 'apMacList', hide: true
            },
            {
                headerName: 'Name', field: 'name', minWidth: 100
            },
            // {
            //     headerName: this.$rootScope.isLang === 'VN' ? 'Thành phố/Tỉnh' : 'City/Province',
            //     width: 200,
            //     field: 'cityName'
            // },
            // {
            //     headerName: this.$rootScope.isLang === 'VN' ? 'Quận/huyện' : 'District',
            //     width: 150,
            //     field: 'districtName'
            // },
            {
                headerName: 'Wifi Network',
                width: 200,
                field: 'categoryName'
            },
            {
                headerName: this.$rootScope.isLang === 'VN' ? 'Chiến dịch' : 'Campaign',
                width: 150,
                template: gridCellCampaignTemplate
            },
            {
                headerName: 'AP',
                width: 150,
                template: gridCellApTemplate
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
                headerName: this.$rootScope.isLang === 'VN' ? 'Hành động' : 'Actions',
                field: '',
                suppressSorting: true,
                minWidth: 280,
                maxWidth: 280,
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
                sortDescending: '<i class="icon-arrow-down8"></i>'
            },
            onGridReady: this.onGridReady.bind(this)
        };
        this.gridOptionsAP = {
            columnDefs: [
                {
                    headerName: 'No',
                    field: '',
                    minWidth: 60,
                    width: 60,
                    suppressSorting: true,
                    cellRenderer: params => params.rowIndex + 1
                },
                {
                    headerName: 'Name', field: 'name', minWidth: 80,
                    editable: true
                },
                {
                    headerName: 'Mac LAN',
                    width: 200,
                    field: 'macLan',
                    editable: true
                },
                {
                    headerName: 'Mac 2.4 GHz',
                    width: 200,
                    field: 'mac',
                    editable: true
                },
                {
                    headerName: 'Mac 5.0 GHz',
                    width: 200,
                    field: 'mac5',
                    editable: true
                },
                {
                    headerName: 'Actions',
                    field: 'selected',
                    suppressSorting: true,
                    minWidth: 200,
                    maxWidth: 200,
                    cellClass: 'overflow-visible',
                    // template: gridCellActionApTemplate,
                    cellRenderer: ApActionRender,
                    cellRendererParams: {
                        currentUser: this.currentUser,
                        remove: data => this.onAction('deleteAp', data),
                        move: data => this.onAction('moveAp', data)
                    }
                }
            ],
            context: this,
            enableColResize: true,
            angularCompileRows: true,
            enableSorting: true,
            enableFilter: true,

            // pagination
            pagination: true,
            paginationPageSize: 25,

            // editRow
            editType: 'fullRow',
            suppressClickEdit: true,
            // onRowValueChanged: function(node) {
            //   let data = node.data;
            //   let oldData = node.node.oldData;
            //   if(data.name !== oldData.name || standardizeMac(data.mac) !== standardizeMac(oldData.mac) || standardizeMac(data.mac5) !== standardizeMac(oldData.mac5)){
            //       that.updateAP(data, oldData);
            //   } else {
            //       node.node.setDataValue('selected', 0);
            //   }
            // },
            onRowEditingStopped: (node) => {
                if (node.node.stopFromCmd) {
                    const data = node.node.data;
                    const oldData = _cloneDeep(node.node.oldData);
                    if (data.name !== oldData.name || standardizeMac(data.mac) !== standardizeMac(oldData.mac) || standardizeMac(data.mac5) !== standardizeMac(oldData.mac5) || standardizeMac(data.macLan) !== standardizeMac(oldData.macLan)) {
                        that.updateAP(data, oldData);
                    } else {
                        node.node.setDataValue('selected', 0);
                    }
                } else {
                    node.node.setData(_cloneDeep(node.node.oldData));
                }
                node.node.stopFromCmd = false;
                node.node.setDataValue('selected', 0);
            },

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
            onGridReady: this.onGridAPReady.bind(this)
        };
    }

    onGridData() {
        this.gridApi.setRowData(this.locations.map((l, idx) => { 
            l.locName = l.name; l.idx = idx + 1;
            l.apMacList = l.apList ? l.apList.map((ap) => {
                if (ap.macLan) {
                    if (ap.mac) {
                        return ap.mac5 ? `${ap.macLan}(${ap.mac},${ap.mac5})` : `${ap.macLan}(${ap.mac})`;
                    }
                    return ap.macLan;
                } else if (ap.mac) {
                    return ap.mac5 ? `${ap.mac}(${ap.mac5})` : ap.mac;
                } else if (ap.mac5) {
                    return ap.mac5;
                }
            }).join(';\n') : [];
            return l;
        }));
        this.gridApi.sizeColumnsToFit();
    }

    onGridApData(data) {
        this.gridApApi.setRowData(_cloneDeep(data));
        setTimeout(() => this.gridApApi.sizeColumnsToFit(), 500);
    }

    onGridReady(event) {
        this.gridApi = event.api;
        this.onGridData();
    }

    onGridAPReady(event) {
        this.gridApApi = event.api;
    }

    updateRow(oldRow, newRow) {
        if (!oldRow && newRow) {
            this.locations.splice(0, 0, newRow);
        } else {
            const idx = _findIndex(this.locations, item => item.id === oldRow.id);
            if (newRow) {
                this.locations.splice(idx, 1, newRow);
            } else {
                this.locations.splice(idx, 1);
            }
        }
        this.updateLocation();
        this.onGridData();
    }

    updateLocation() {
        this.locations = this.locations.map(l => {
            if (l.cityId) {
                const foundCity = this.cities.find(c => c.id == l.cityId);
                if (foundCity) {
                    l.cityName = foundCity.text;
                    if (l.districtId && foundCity.options && foundCity.options.district) {
                        const foundDistrict = foundCity.options.district.find(d => d.value == l.districtId);
                        if (foundDistrict) {
                            l.districtName = foundDistrict.text;
                        }
                    }
                }
            }
            return l;
        });
    }

    onAction(action, row) {
        switch (action) {
            case 'new':
                $('#fmEdit').modal();
                this.startJoyRideLoc = false;
            case 'edit':
            case 'addAp':
            case 'moveAp':
            case 'deleteAp':
            case 'deleteApCsv':
            case 'OpenExpand':
            case 'delete':
            case 'getCode':
            case 'getCatfishCode':
            case 'exportUrl':
            case 'generateCode':
            case 'generateUrl':
            case 'copyCode':
            case 'downloadCode':
            case 'editCampaign':
            case 'editAp':
            case 'editAPs':
            case 'applyCampaign':
            case 'importVen':
            case 'exportVen':
            case 'refresh':
                this[action](row);
                break;
            default:
                break;
        }
    }

    new() {
        this.districts = [];
        this.obj = { createdBy: this.currentUser.id };
    }

    closeModal() {
        this.$rootScope.createdGuidance = 'closed';
    }

    getCode(row) {
        this.objCode = {
            id: row.id,
            macField: 'Device-MAC'
        };
        this.hotspotType = 'default';
        this.objType = {
            id: row.id
        };
    }

    getCatfishCode(row) {
        $('#fmCampaign').modal('hide');
        this.objCatfishCode = {
            id: this.obj.id,
            campaignId: row.campaignId,
            hosts: '',
            apRoute: '',
            macField: 'Device-MAC',
            campaignName: row.campaignName
        };
    }

    exportUrl(row) {
        this.obj = { ...row };
        if (!row.externalParams) { this.obj.externalParams = {}; }
        this.objCode = {
            id: row.id
        };
        setTimeout(() => {
            $('[data-toggle="popover"]').popover({
                trigger: 'hover'
            });
        }, 200);
    }

    generateCode(type) {
        if (type) {
            this.Location
                .getTrackingCode(this.objCatfishCode).$promise
                .then((response) => {
                    this.objCatfishCode.jsCode = `<script type="text/javascript">\n${response.jsCode}\n</script>`;
                });
        } else {
            this.Location
                .getTrackingCode(this.objCode).$promise
                .then((response) => {
                    this.objCode.jsCode = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="viewport" content="width=device-width"/></head><body><script type="text/javascript">\n${response.jsCode}\n</script></body></html>`;
                });
        }
    }

    copyCode(type) {
        if (type) {
            document.getElementById(type).select();
        } else {
            document.getElementById('catfishCode').select();
        }
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

    generateUrl() {
        console.log('[generateUrl]', this.hotspotType);
        this.objType.type = this.hotspotType;
        if (this.hotspotType === 'pfsense') {
            this.objCode.jsCode = `<html>
    <body>
        <input name="portalurl" id="portalurl" type="hidden" value="$PORTAL_ACTION$">
        <input name="portalzone" id="portalzone" type="hidden" value="$PORTAL_ZONE$">
        <input name="clientmac" id="clientmac" type="hidden" value="$CLIENT_MAC$">
        <input name="clientip" id="clientip" type="hidden" value="$CLIENT_IP$">
        <p>Loading Creative Ads</p>
        <script>
        setTimeout(function() {
            var portalurl = document.getElementById("portalurl").value;
            var clientip = document.getElementById("clientip").value;
            var clientmac = document.getElementById("clientmac").value;
            var portalzone = document.getElementById("portalzone").value;
            console.log(clientip);
            console.log(clientmac);
            window.location = "https://cloud.kaimedia.org/api/Locations/${this.objType.id}/externalType/pfsense?clientip="+ clientip + "&clientmac=" + clientmac + "&portalzone=" + portalzone + "&portalurl=" + encodeURIComponent(portalurl)
        }, 1000);
        </script>
    </body>
</html>`;
        } else {
            const chain = Promise.resolve();
            chain
                .then(() => this.Location
                    .getExternalUrl(this.objType).$promise
                    .then((response) => {
                        this.objType.url = response.jsCode;
                        // this.objCode.successUrl = response.successUrl;
                    }))
                .catch(err => console.log(err));
        }
    }

    downloadCode() {
        const element = document.createElement('a');
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(this.objCode.jsCode)}`);
        element.setAttribute('download', 'index.html');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    edit(row) {
        if (!row.cityId) {
            this.districts = [];
        } else {
            const foundCityDistrict = this.cities.find(ct => ct.id === row.cityId);
            this.districts = foundCityDistrict.options && foundCityDistrict.options.district ? foundCityDistrict.options.district : [];
            this.districts.map(d => {
                d.id = d.value;
                return d;
            });
            this.selectDistrict.data = this.districts;
        }
        this.obj = { ...row };
        delete this.obj.$promise;
        delete this.obj.$resolved;
    }

    editCampaign(row) {
        this.edit(row);
        this.camObj = _cloneDeep(this.obj.activeCampaigns);

        // document.body.appendChild(link); // Required for FF
        //
        // link.click();
        // window.open(encodedUri);
    }

    editAp(row) {
        let currentNode;
        const renderNodes = this.gridApApi.getRenderedNodes();
        for (let i = 0; i < renderNodes.length; i++) {
            if (renderNodes[i].data.id === row.id) {
                currentNode = renderNodes[i];
            }
        }
        if (currentNode.selected) {
            currentNode.selected = false;
            this.gridApApi.stopEditing();
        } else {
            this.gridApApi.setFocusedCell(currentNode.rowIndex, 'make');
            this.gridApApi.startEditingCell({ rowIndex: currentNode.rowIndex, colKey: 'name' });
            currentNode.oldData = _cloneDeep(row);
            currentNode.selected = true;
        }
    }

    editAPs(row) {
        this.edit(row);
        setTimeout(() => {
            const exportBtn = document.getElementById('exportCSV');
            if (!exportBtn) return;
            const rows = [['No', 'Name', 'Mac 2.4GHz', 'Mac 5.0GHz']];
            if (row.apList) {
                row.apList.forEach((item, idx) => {
                    rows.push([idx + 1, item.name, item.mac, item.mac5, item.macLan]);
                });
            }
            let csvContent = 'data:text/csv;charset=utf-8,';
            rows.forEach((rowArray) => {
                csvContent += rowArray.join(',') + '\r\n';
            });
            const encodedUri = encodeURI(csvContent);
            exportBtn.setAttribute('href', encodedUri);
            exportBtn.setAttribute('download', `${row.name}_AP.csv`);
        }, 500);

        this.onGridApData(row.apList);
    }

    applyCampaign() {
        const priorities = this.camObj.map(item => item.priority);
        priorities.sort();
        this.camObj.forEach((item, index) => {
            item.priority = priorities[index];
        });

        this.obj.activeCampaigns = this.camObj;
        this.Location
            .changeCampaignPriority(this.obj).$promise
            .then((savedObj) => {
                this.alertify.success(this.Messages.updateSuccess);
                this.updateRow(this.obj, savedObj);
                this.edit(savedObj);
            });
    }

    create(validForm) {
        if (!validForm) {
            if (this.fmEdit.name) {
                this.fmEdit.name.$setDirty();
                this.fmEdit.name.$validate();
            }

            // if (this.fmEdit.cityId) {
            //     this.fmEdit.cityId.$setDirty();
            //     this.fmEdit.cityId.$validate();
            // }

            // if (this.fmEdit.districtId) {
            //     this.fmEdit.districtId.$setDirty();
            //     this.fmEdit.districtId.$validate();
            // }

            // if (this.fmEdit.address) {
            //     this.fmEdit.address.$setDirty();
            //     this.fmEdit.address.$validate();
            // }

            return;
        }

        if (this.obj.cityId) {
            const foundCityName = this.cities.find(c => c.id === this.obj.cityId);
            if (foundCityName) {
                this.obj.cityName = foundCityName.text;
            }
        }
        if (this.obj.categoryId) {
            const foundNetwork = this.locationGroups.find(ca => ca.id === this.obj.categoryId);
            if (foundNetwork) {
                this.obj.categoryName = foundNetwork.text;
            }
        }
        const chain = Promise.resolve();
        if (this.obj.id) {
            delete this.obj.$resolved; delete this.obj.$promise; delete this.obj.districtName; delete this.obj.idx; delete this.obj.apMacList; delete this.obj.locName;
            chain
                .then(() => this.Location.replaceById(this.obj).$promise)
                .then((savedObj) => {
                    this.alertify.success(this.Messages.updateSuccess);
                    this.updateRow(this.obj, savedObj);
                    // this.edit(savedObj);
                    $('#fmEdit').modal('hide');
                })
                .catch(() => {
                    this.alertify.error(this.Messages.updateFailed);
                });
        } else {
            chain
                .then(() => this.Location.create(this.obj).$promise)
                .then((savedObj) => {
                    this.alertify.success(this.Messages.createSuccess);
                    this.updateRow(null, savedObj);
                    // this.edit(savedObj);
                    $('#fmEdit').modal('hide');
                })
                .catch((err) => {
                    console.log('Create location err', err);
                    this.alertify.error(this.Messages.createFailed);
                }).finally(() => {
                    setTimeout(() => {
                        if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
                            return this.$state.go('admin.location-group', { guidance: true, created: moment().valueOf() });
                        }
                    }, 50);
                });
        }
    }

    exportVen() {
        this.gridApi.exportDataAsCsv({
            columnKeys: ['idx', 'locName', 'apMacList'],
            fileName: 'Locations.csv'
        });
    }

    importVen() {
        this.importSuccess = false;
        this.importCSVErr = false;
        this.apList = [];
        if (!this.importModal) {
            const that = this;
            this.importModal = $('#fmImportLocation').modal();
            this.importModal.on('hidden.bs.modal', (e) => {
                that.refresh(true);
            });
        }
        $('#fmImportLocation').modal();
    }

    downloadTemplateImportLocation() {
        let csv = convertArrayOfObjectsToCSV({ data: [
            { No: '1', 'Location (*)': 'Location A', 'AP Name (*)': 'AP01', 'MAC Lan (*)': 'AA:BB:CC:DD:EE:FF', 'MAC 2.4GHz': '', 'MAC 5GHz': '' },
            { No: '2', 'Location (*)': 'Location A', 'AP Name (*)': 'AP02', 'MAC Lan (*)': '11:22:33:44:55:66', 'MAC 2.4GHz': '', 'MAC 5GHz': '' },
            { No: '3', 'Location (*)': 'Location B', 'AP Name (*)': 'AP01', 'MAC Lan (*)': 'A1:B2:C3:D4:E5:F6', 'MAC 2.4GHz': '', 'MAC 5GHz': '' },
            { No: '4', 'Location (*)': 'Chi Nhánh 1', 'AP Name (*)': 'AP01', 'MAC Lan (*)': '1A:2B:3C:4D:5E:6F', 'MAC 2.4GHz': '', 'MAC 5GHz': '' }
        ] });
        if (!csv) return;
        const filename = 'TemplateUpload.csv';
        if (!csv.match(/^data:text\/csv/i)) {
            csv = `data:text/csv;charset=UTF-8,${csv}`;
        }

        const data = encodeURI(csv);

        const link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.click();
    }

    addListenerLocation() {
        const that = this;
        this.importWithCreateLocation = false;
        const input = document.getElementById('uploadCsvLocation');
        if (input) {
            if (!input.files) {
                alert("This browser doesn't seem to support the `files` property of file inputs.");
            } else if (!input.files[0]) {
                // alert("Please select a file");
            } else {
                this.readingCSV = true;
                this.importCSVErr = false;
                Papa.parse(input.files[0], {
                    complete: (results) => {
                        const apList = [];
                        let itemAdd = {};
                        results.data.forEach((item, idx) => {
                            if (idx === 0) return;
                            itemAdd = {};
                            if (item[1] && item[1].trim() && item[2] && item[2].trim() && ((item[3] && item[3].trim()) || (item[4] && item[4].trim()) || (item[5] && item[5].trim()))) {
                                itemAdd.location = item[1].trim();
                                itemAdd.name = item[2].trim();
                                if (item[3]) {
                                    if (regexMAC.test(item[3].trim().toUpperCase())) {
                                        itemAdd.macLan = standardizeMac(item[3].trim());
                                    } else {
                                        itemAdd.macLan = item[3];
                                        itemAdd.errLan = 1;
                                        itemAdd.err = 'Mac address wrong';
                                        that.importCSVErr = true;
                                    }
                                }
                                if (item[4]) {
                                    if (regexMAC.test(item[4].trim().toUpperCase())) {
                                        itemAdd.mac = standardizeMac(item[4].trim());
                                    } else {
                                        itemAdd.mac = item[4];
                                        itemAdd.errMac = 1;
                                        itemAdd.err = 'Mac address 2.4GHz wrong';
                                        that.importCSVErr = true;
                                    }
                                }
                                if (item[5]) {
                                    if (regexMAC.test(item[5].trim().toUpperCase())) {
                                        itemAdd.mac5 = standardizeMac(item[5].trim());
                                    } else {
                                        itemAdd.mac5 = item[3];
                                        itemAdd.err5 = 1;
                                        itemAdd.err = 'Mac address 5GHz wrong';
                                        that.importCSVErr = true;
                                    }
                                }
                                let validateMac = ValidateApMac(itemAdd);
                                if (validateMac) {
                                    itemAdd.err = validateMac;
                                    that.importCSVErr = true;
                                }
                            } else {
                                that.importCSVErr = true;
                                if (!item[1] || !item[1].trim()) itemAdd.err = 'Location name empty';
                                else if (!item[2] || !item[2].trim()) itemAdd.err = 'AP name empty';
                                else if (!item[3] || !item[3].trim() || !item[4] || !item[4].trim() || !item[5] || !item[5].trim()) itemAdd.err = 'Mac address empty';
                            }
                            apList.push(itemAdd);
                        });
                        that.apList = apList;
                        that.readingCSV = false;
                        that.$scope.$apply();
                        input.value = '';
                    }
                });
            }
        }
    }

    importLocAndAp() {
        let locationToAddAP = [];
        // let locationToCreate = [];
        this.loadingImport = true;
        this.apList.forEach(({ location }) => {
            if (locationToAddAP.indexOf(location) < 0) {
                locationToAddAP.push(location);
            }
        });
        const that = this;
        locationToAddAP = locationToAddAP.map((loc) => {
            if (this.addApToExists) {
                const existsLoc = _findIndex(this.locations, ['name', loc]);
                if (existsLoc > -1) {
                    return this.locations[existsLoc].toJSON();
                }
            }
            return { name: loc };
        });
        const chain = Promise.resolve();
        Promise.each(this.apList, (row, idx) => {
            // check location
            const locIdx = locationToAddAP.findIndex(loc => loc.name === row.location);
            return chain
                .then(() => locationToAddAP[locIdx].id ? locationToAddAP[locIdx] : that.Location.create(locationToAddAP[locIdx]).$promise)
                .then((location) => {
                    locationToAddAP[locIdx] = location;
                    return that.Location.importLocAP({ locId: location.id, ap: { name: row.name, macLan: row.macLan, mac: row.mac, mac5: row.mac5 }, user: this.currentUser.id }).$promise;
                    // add AP
                })
                .then((response) => {
                    that.apList[idx] = Object.assign({}, that.apList[idx], response);
                    that.$scope.$apply();
                })
                .catch((err) => {
                    console.log('import problem', err);
                });
            // console.log('locInfo', locInfo);
            // return new Promise((resolve, reject) => {
            //     // Set up the timeout
            //     setTimeout(() => {
            //         that.apList[idx].status = 'OK';
            //         console.log('processing', idx, that.apList[idx]);
            //         that.$scope.$apply();
            //         resolve();
            //     }, 200);
            // });
        }).then((res) => {
            that.loadingImport = false;
            that.importSuccess = true;
            that.$scope.$apply();
            // $('#fmImportLocation').modal('hide');
        });
    }

    addListener() {
        const that = this;
        const input = document.getElementById('uploadCsv');
        if (input) {
            if (!input.files) {
                alert("This browser doesn't seem to support the `files` property of file inputs.");
            } else if (!input.files[0]) {
                // alert("Please select a file");
            } else {
                this.readingCSV = true;
                this.importCSVErr = false;
                Papa.parse(input.files[0], {
                    complete: (results, file) => {
                        let apList = [], itemAdd = {};
                        results.data.forEach((item, idx) => {
                            if (idx === 0) return;
                            itemAdd = {};
                            if (item[1] && (item[2] || item[3] || item[4])) {
                                itemAdd.name = item[1];
                                if (item[2]) {
                                    if (regexMAC.test(item[2].toUpperCase())) {
                                        itemAdd.macLan = standardizeMac(item[2]);
                                    } else {
                                        itemAdd.macLan = item[2];
                                        itemAdd.errLan = 1;
                                        that.importCSVErr = true;
                                    }
                                }
                                if (item[3]) {
                                    if (regexMAC.test(item[3].toUpperCase())) {
                                        itemAdd.mac = standardizeMac(item[3]);
                                    } else {
                                        itemAdd.mac = item[3];
                                        itemAdd.err = 1;
                                        that.importCSVErr = true;
                                    }
                                }
                                if (item[4]) {
                                    if (regexMAC.test(item[4].toUpperCase())) {
                                        itemAdd.mac5 = standardizeMac(item[4]);
                                    } else {
                                        itemAdd.mac5 = item[4];
                                        itemAdd.err5 = 1;
                                        that.importCSVErr = true;
                                    }
                                }
                                apList.push(itemAdd);
                            }
                        });
                        that.apList = apList;
                        that.readingCSV = false;
                        that.$scope.$apply();
                        input.value = '';
                    }
                });
            }
        }
    }

    addAp(row) {
        this.obj = { ...row };
        this.ap = {};
        this.apList = [];
    }
    moveAp(movAp) {
        this.ap = movAp;
        $('#fmLocList').modal();
    }
    onMoveAp(loc) {
        if (!confirm(`Move AP ${this.ap.name} (${this.ap.mac || ''} | ${this.ap.mac5 || ''} | ${this.ap.macLan || ''}) to ${loc.name} ?`)) {
            return;
        }
        const chain = Promise.resolve();
        chain
            .then(() => this.Location.APProcess({ id: loc.id, ap: [this.ap], user: this.currentUser.id, type: 'move' }).$promise)
            .then((savedObj) => {
                $('#fmLocList').modal('hide');
                let indexMove = 0;
                for (let i = 0; i < this.obj.apList.length; i++) {
                    if (this.obj.apList[i].id === this.ap.id) {
                        indexMove = i;
                        break;
                    }
                }
                this.onGridApData([...this.obj.apList.slice(0, indexMove), ...this.obj.apList.slice(indexMove + 1)]);
                this.alertify.success('Move Ap Success!');
                this.refresh(true);
            })
            .catch((err) => {
                this.alertify.error(`${this.Messages.updateFailed} ${err.data.error.message}`);
                this.gridApApi.setRowData(_cloneDeep(this.obj.apList));
            });
    }
    deleteAp(removeAP) {
        const chain = Promise.resolve();
        if (!confirm(`Remove AP ${removeAP.name} (${removeAP.mac || ''} | ${removeAP.mac5 || ''} | ${removeAP.macLan || ''})`)) {
            return;
        }
        delete this.obj.$resolved; delete this.obj.$promise;
        chain
            .then(() => this.Location.APProcess({ id: this.obj.id, ap: [removeAP], user: this.currentUser.id, type: 'delete' }).$promise)
            .then(() => this.refresh(true))
            .then((savedObj) => {
                let indexRemove = 0;
                for (let i = 0; i < this.obj.apList.length; i++) {
                    if (this.obj.apList[i].id === removeAP.id) {
                        indexRemove = i;
                        break;
                    }
                }
                this.onGridApData([...this.obj.apList.slice(0, indexRemove), ...this.obj.apList.slice(indexRemove + 1)]);
                this.alertify.success(this.Messages.deleteSuccess);
            })
            .catch(() => {
                this.alertify.error(this.Messages.deleteFailed);
            });
    }
    deleteApCsv(idx) {
        const chain = Promise.resolve();
        this.apList = [...this.apList.slice(0, idx), ...this.apList.slice(idx + 1)];
        delete this.obj.$resolved; delete this.obj.$promise;
        chain
            .then(() => this.Location.replaceById(this.obj).$promise)
            .then((savedObj) => {
                this.alertify.success(this.Messages.deleteSuccess);
                this.updateRow(this.obj, savedObj);
            })
            .catch(() => {
                this.alertify.error(this.Messages.deleteFailed);
            });
    }
    createAp() {
        const chain = Promise.resolve();
        let saveAp = [], saveObj = _cloneDeep(this.obj);
        // Validate
        if (!this.ap.macLan) this.ap.macLan = '';
        this.ap.macLan = standardizeMac(this.ap.macLan);
        if (!this.ap.mac) this.ap.mac = '';
        this.ap.mac = standardizeMac(this.ap.mac);
        if (!this.ap.mac5) this.ap.mac5 = '';
        this.ap.mac5 = standardizeMac(this.ap.mac5);
        let validate;

        if (this.importCSVMode) {
            saveAp = this.apList;
            for (let l = 0; l < this.apList.length; l++) {
                if (ValidateApMac(this.apList[l])) {
                    this.apList[l].err = 1;
                    this.apList[l].err5 = 1;
                    this.apList[l].errLan = 1;
                    validate = ValidateApMac(this.apList[l]);
                    break;
                }
            }
        } else {
            validate = ValidateApMac(this.ap);
            saveAp = [Object.assign({}, this.ap, {
                macLan: this.ap.macLan, mac: this.ap.mac, mac5: this.ap.mac5
            })];
        }
        if (validate) {
            this.alertify.error(validate);
            return;
        }
        if (!saveObj.apList) {
            saveObj.apList = [];
        }
        if (this.importCSVMode) {
            saveAp.forEach((item) => {
                saveObj.apList.push(Object.assign({}, item, {
                    macLan: standardizeMac(item.macLan),
                    mac: standardizeMac(item.mac),
                    mac5: standardizeMac(item.mac5)
                }));
            });
        } else {
            saveObj.apList.push(Object.assign({}, this.ap, {
                macLan: standardizeMac(this.ap.macLan),
                mac: standardizeMac(this.ap.mac),
                mac5: standardizeMac(this.ap.mac5)
            }));
        }
        delete this.obj.$resolved; delete this.obj.$promise;
        chain
            .then(() => this.Location.APProcess({ id: this.obj.id, ap: saveAp, user: this.currentUser.id }).$promise)
            .then(() => this.refresh(true))
            .then((savedObj) => {
                this.alertify.success(this.Messages.updateSuccess);
                this.ap = {};
                $('#fmAddAp').modal('hide');
            })
            .catch((err) => {
                if (err.data.error.message.indexOf('expand') > -1) {
                    document.getElementById('openExpandNotify').style.display = 'block';
                } else {
                    this.alertify.error(this.Messages.updateFailed + ' ' + err.data.error.message);
                }
                if (this.importCSVMode && err.data.error.message.indexOf('exists')) {
                    let apErr = err.data.error.message.split('AP exists: ');
                    let apErrObj = {};
                    apErr[1].split(',').forEach((a) => {
                        apErrObj[a] = 1;
                    });
                    this.apList.map((item) => {
                        if (apErrObj[item.mac]) item.err = 1;
                        if (apErrObj[item.mac5]) item.err5 = 1;
                        if (apErrObj[item.macLan]) item.errLan = 1;
                        return item;
                    });
                    this.$scope.$apply();
                }
            });
    }
    updateAP(current, oldData) {
        const chain = Promise.resolve();
        let that = this;
        let saveAp = [], saveObj = _cloneDeep(this.obj);
        //Validate
        if (!current.macLan) current.macLan = "";
        current.macLan = standardizeMac(current.macLan);
        if (!current.mac) current.mac = "";
        current.mac = standardizeMac(current.mac);
        if (!current.mac5) current.mac5 = "";
        current.mac5 = standardizeMac(current.mac5);
        let validate = ValidateApMac(current);
        if (validate) {
            this.alertify.error(validate);
            this.gridApApi.setRowData(_cloneDeep(this.obj.apList));
            return;
        } else {
            saveAp = [current];
            chain
                .then(() => this.Location.APProcess({ id: this.obj.id, ap: saveAp, user: this.currentUser.id, type: 'update' }).$promise)
                .then((savedObj) => {
                    this.alertify.success(this.Messages.updateSuccess);
                    this.refresh(true);
                })
                .catch((err) => {
                    this.alertify.error(this.Messages.updateFailed + ' ' + err.data.error.message);
                    this.gridApApi.setRowData(_cloneDeep(this.obj.apList));
                });
        }
    }
    toogleExpandLicense() {
        $('#fmAddAp').modal('hide');
        $('#fmExpandLicense').modal();
    }

    delete(row) {
        let haveCampaign = this.locationMap[row.id] ? true : false, messages;
        if (haveCampaign) {
            messages = this.Messages.confirmInvalidCampaign.format(`location ${row.name}`, this.locationMap[row.id].map(({ name }) => name).toString());
        } else {
            messages = this.Messages.confirmDelete.format(`location ${row.name}`)
        }
        this.alertify.confirm(messages, () => {
            this.Location
                .deleteById({ id: row.id }).$promise
                .then(() => {
                    if (haveCampaign) {
                        Promise.each(this.locationMap[row.id], (camp) => {
                            this.Campaign.updateAll({ where: { id: camp.id } }, { status: 'invalid' });
                        }).catch((err) => this.alertify.error('Update campaign failed!'));
                    }
                    this.updateRow(row);
                    this.alertify.success(this.Messages.deleteSuccess);
                }).catch(() => {
                    this.alertify.error(this.Messages.deleteFailed);
                });
        }, () => {
            this.alertify.log('You cancelled');
        });
    }

    async refresh(ignore) {
        let query = {};
        if (this.currentUser.profileName === 'admin') {
            const users = await this.User.find().$promise;
            query = {
                where: {
                    "or": [
                        { "createdBy": this.currentUser.id },
                        ...users.map((usr) => ({ "createdBy": usr.id }))
                    ]
                }
            };
        } else if (this.currentUser.profileName !== 'superadmin') {
            query = { where: { "createdBy": this.currentUser.id } };
        }
        this.Campaign.find({ filter: query }).$promise.then((campaigns) => {
            campaigns.forEach((camp) => {
                if (camp.locations) {
                    camp.locations.forEach((loc) => {
                        if (!this.locationMap[loc.locationId]) {
                            this.locationMap[loc.locationId] = [{ name: camp.name, id: camp.id }];
                        } else {
                            this.locationMap[loc.locationId].push({ name: camp.name, id: camp.id });
                        }
                    });
                }
            });
        });
        this.Location
            .find({ filter: query }).$promise
            .then((locations) => {
                this.locations = locations;
                this.updateLocation();
                this.onGridData();
                if (!ignore) {
                    this.obj = {};
                    this.alertify.success(this.Messages.refreshSuccess);
                }
            });
    }
}

const standardizeMac = (a) => {
    return a ? a.replace(/\s/g, '').toUpperCase() : '';
};

function ValidateApMac(data) {
    if (data.macLan && !regexMAC.test(data.macLan.toUpperCase())) {
        return 'Mac MAC LAN wrong format!';
    }
    if (data.mac && !regexMAC.test(data.mac.toUpperCase())) {
        return 'Mac MAC 2.4GHz wrong format!';
    }
    if (data.mac5 && !regexMAC.test(data.mac5.toUpperCase())) {
        return 'Mac MAC 5.0GHz wrong format!';
    }
    if (data.mac && data.macLan) {
        if (data.mac.substr(0, 15) !== data.macLan.substr(0, 15)) {
            return 'LAN and 2.4GHz MAC not match in an AP!';
        }
        if (data.mac === data.macLan) {
            return 'LAN and 2.4GHz MAC require not match!';
        }
    }
    if (data.mac5 && data.macLan) {
        if (data.mac5.substr(0, 15) !== data.macLan.substr(0, 15)) {
            return 'LAN and 5.0GHz MAC not match in an AP!';
        }
        if (data.macLan === data.mac5) {
            return 'LAN and 5.0GHz MAC require not match!';
        }
    }
    if (data.mac && data.mac5) {
        if (data.mac.substr(0, 15) !== data.mac5.substr(0, 15)) {
            return '2.4GHz and 5.0GHz MAC not match in an AP!';
        }
        if (data.mac === data.mac5) {
            return '2.4GHz and 5.0GHz MAC require not match!';
        }
    }
    return 0;
}

function convertArrayOfObjectsToCSV(args) {
    const data = args.data;
    if (!data || !data.length) return;

    const columnDelimiter = args.columnDelimiter || ',';
    const lineDelimiter = args.lineDelimiter || '\n';

    const keys = Object.keys(data[0]);

    let result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(item => {
        let ctr = 0;
        keys.forEach(key => {
            if (ctr > 0) result += columnDelimiter;
            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

export default angular
    .module('app.location.controller', [
        'agGrid',
        'app.directive.dragula',
        'app.directive.select2',
        'ngJoyRide',
    ])
    .controller('LocationCtrl', LocationCtrl)
    .directive("ngUploadChange", function () {
        return {
            scope: {
                ngUploadChange: "&"
            },
            link: function ($scope, $element, $attrs) {
                $element.on("change", function (event) {
                    $scope.$apply(function () {
                        $scope.ngUploadChange({ $event: event })
                    })
                })
                $scope.$on("$destroy", function () {
                    $element.off();
                });
            }
        }
    })
    .directive('macValidate', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, mCtrl) {
                function capitalize(inputValue) {
                    if (inputValue == undefined) inputValue = '';
                    var capitalized = inputValue.toUpperCase();
                    if (capitalized !== inputValue) {
                        // see where the cursor is before the update so that we can set it back
                        var selection = element[0].selectionStart;
                        mCtrl.$setViewValue(capitalized);
                        mCtrl.$render();
                        // set back the cursor after rendering
                        element[0].selectionStart = selection;
                        element[0].selectionEnd = selection;
                    }
                    return capitalized.replace(/\s/g, '');
                }
                function myValidation(value) {
                    if (regexMAC.test(value.toUpperCase())) {
                        mCtrl.$setValidity('charE', true);
                    } else {
                        mCtrl.$setValidity('charE', false);
                    }
                    mCtrl.$setViewValue(value.toUpperCase());
                    return value;
                }
                mCtrl.$parsers.push(capitalize);
                mCtrl.$parsers.push(myValidation);
                capitalize(scope[attr.ngModel]);
            }
        };
    }).filter('filterLoc', function () {
        return function (items, condition) {
            let filtered = [];

            if (condition === undefined || condition === '') {
                return items;
            }

            angular.forEach(items, function (item) {
                if (condition !== item.id) {
                    filtered.push(item);
                }
            });

            return filtered;
        };
    });
