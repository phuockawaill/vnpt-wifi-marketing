import _findIndex from 'lodash/findIndex';
import _merge from 'lodash/merge';
import moment from 'moment';
import gridCellActionTemplate from './grid.cell-action.pug';
import gridCellActionTemplateForm from './grid.cell-action-form.pug';
import gridCellCampaignTemplate from './grid.cell-campaign.pug';
import './banner.less';
import Generate from './generalTemplate/generateJs';
import { scriptLogin } from './generalTemplate/form';
import { initVideo } from './generalTemplate/video';
import htmlCodeExample from 'assets/images/html_code_example.png';

const axios = require('axios');
const lodash = require('lodash');

class BannerCtrl {
    constructor($state, $rootScope, $scope, LoopBackResource, $window, alertify, AppConfig, Messages, VNMessages, User, FormGenerate, Banner, Configuration, banners, Campaign, campaigns, templates, currentUser, forms,
        ages,
        genders,
        incomes,
        devices,
        oses,
        websiteCats,
        Notification,
        AuthEvents,
    ) {
        const removeModalBackdrop = angular.element(document.querySelectorAll('.modal-backdrop'));
        for (let i = 0; i < removeModalBackdrop.length; i++) {
            angular.element(removeModalBackdrop[i]).remove();
        }

        const removeColorPicker = angular.element(document.querySelectorAll('.color-picker'));
        for (let i = 0; i < removeColorPicker.length; i++) {
            angular.element(removeColorPicker[i]).remove();
        }

        const removeDzHiddenInput = angular.element(document.querySelectorAll('.dz-hidden-input'));
        for (let i = 0; i < removeDzHiddenInput.length; i++) {
            angular.element(removeDzHiddenInput[i]).remove();
        }

        this.LoopBackResource = LoopBackResource;
        this.$window = $window;
        this.$state = $state;
        this.$rootScope = $rootScope;
        this.AuthEvents = AuthEvents;

        this.Notification = Notification;
        this.alertify = alertify;
        this.Messages = this.$rootScope.isLang === 'VN' ? VNMessages : Messages;
        this.AppConfig = AppConfig;
        this.User = User;
        this.Banner = Banner;
        this.FormGenerate = FormGenerate;
        this.Campaign = Campaign;

        this.imgHtmlCodeExample = htmlCodeExample;
        this.templates = templates;
        this.banners = banners;
        this.forms = forms;
        this.currentUser = currentUser;
        this.bodyScript = scriptLogin({ hotspotModel: 'none' }).replace(/^\s+|\s+$/gm, '');
        this.saveDesign = false;
        this.saveFileTmp = {};
        this.generatedHTML = '';
        this.objTemplates = {};
        this.editOptions = {};
        this.trialUser = currentUser.profileName === 'client' && currentUser.options && currentUser.options.trial;
        this.obj = {
            templateType: 'passCode',
            options: {
                body: {
                    backgroundColor: '#ffffff',
                    fontFamily: 'Montserrat, sans-serif',
                },
                bgImage: '',
                sizeImage: '50%',
                btn: {
                    text: 'Connect Internet',
                    color: '#ffffff',
                    fontWeight: 'bolder',
                    backgroundColor: '#3aaee0',
                    textAlign: 'center',
                    xDirection: '0%',
                    yDirection: '0%',
                    borderStyle: 'solid',
                    borderWidth: '0px',
                    borderColor: '#cccccc',
                    borderTopStyle: 'solid',
                    borderTopWidth: '0px',
                    borderTopColor: '#cccccc',
                    borderRightStyle: 'solid',
                    borderRightWidth: '0px',
                    borderRightColor: '#cccccc',
                    borderBottomStyle: 'solid',
                    borderBottomWidth: '0px',
                    borderBottomColor: '#cccccc',
                    borderLeftStyle: 'solid',
                    borderLeftWidth: '0px',
                    borderLeftColor: '#cccccc',
                    borderRadius: '4px',
                    padding: '10px',
                    paddingTop: '10px',
                    paddingRight: '10px',
                    paddingBottom: '10px',
                    paddingLeft: '10px',
                },
                btnBorderOption: 'allsides',
                btnPaddingOption: 'allsides',
            }
        };
        this.userData = {};
        this.defaultTemplates = [];
        this.fontFamilies = [
            { text: 'Montserrat', value: 'Montserrat, sans-serif' },
            { text: 'Andale Mono', value: '"andale mono", times' },
            { text: 'Arial', value: 'arial, helvetica, sans-serif' },
            { text: 'Arial Black', value: '"arial black", "avant garde", arial' },
            { text: 'Book Antiqua', value: '"book antiqua", palatino' },
            { text: 'Cabin', value: 'Cabin, sans-serif' },
            { text: 'Comic Sans MS', value: '"comic sans ms", sans-serif' },
            { text: 'Courier New', value: '"courier new", courier' },
            { text: 'Crimson Text', value: '"Crimson Text", serif' },
            { text: 'Georgia', value: 'georgia, palatino' },
            { text: 'Helvetica', value: 'helvetica, sans-serif' },
            { text: 'Impact', value: 'impact, chicago' },
            { text: 'Lato', value: 'Lato, sans-serif' },
            { text: 'Lobster Two', value: '"Lobster Two", cursive' },
            { text: 'Old Standard TT', value: '"Old Standard TT", serif' },
            { text: 'Open Sans', value: '"Open Sans", sans-serif' },
            { text: 'Pacifico', value: 'Pacifico, cursive' },
            { text: 'Playfair Display', value: '"Playfair Display", serif' },
            { text: 'Raleway', value: 'Raleway, sans-serif' },
            { text: 'Rubik', value: 'Rubik, sans-serif' },
            { text: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
            { text: 'Symbol', value: 'symbol' },
            { text: 'Tahoma', value: 'tahoma, arial, helvetica, sans-serif' },
            { text: 'Terminal', value: 'terminal, monaco' },
            { text: 'Times New Roman', value: '"times new roman", times' },
            { text: 'Trebuchet MS', value: '"trebuchet ms", geneva' },
            { text: 'Verdana', value: 'verdana, geneva' },
        ];
        this.sidebarLeft = true;
        this.sidebarRight = true;
        this.mode = 'banner';
        this.previewMode = 'Laptop';
        this.staticImgPreviewMode = 'Laptop';
        this.previewCreateMode = false;
        this.previewLink = null;
        // Filter categories
        this.ages = ages;
        this.genders = genders;
        this.incomes = incomes;
        this.devices = devices;
        this.oses = oses;
        this.websiteCats = websiteCats;
        this.campaigns = campaigns;
        this.viewHeight = window.innerHeight;

        this.bannerMap = {};
        this.objCampaigns = [];
        campaigns.forEach((camp) => {
            if (!this.bannerMap[camp.bannerDefaultId]) {
                this.bannerMap[camp.bannerDefaultId] = [{ name: camp.name, id: camp.id }];
            } else {
                this.bannerMap[camp.bannerDefaultId].push({ name: camp.name, id: camp.id });
            }
            if (camp.banners) {
                camp.banners.forEach((campC) => {
                    if (!this.bannerMap[campC.bannerId]) {
                        this.bannerMap[campC.bannerId] = [{ name: camp.name, id: camp.id, filters: campC.filters }];
                    } else {
                        this.bannerMap[campC.bannerId].push({ name: camp.name, id: camp.id, filters: campC.filters });
                    }
                });
            }
        });

        Configuration.find({}).$promise.then((data) => {
            data.forEach((item) => {
                AppConfig[item.key] = item.value;
            });
        });
        this.initGrid();
        initVideo(this);
        this.$scope = $scope;

        this.quickSetup = (this.$state.params && this.$state.params.quick) ? this.$state.params.quick : false;
        if (this.quickSetup) {
            setTimeout(() => {
                this.onAction('new');
            }, 1000);

            setTimeout(() => {
                $('#fmEdit').modal();
            }, 1500);
        }

        this.quickIsPreview = (this.$state.params && this.$state.params.is_preview) ? this.$state.params.is_preview : false;
        if (this.quickIsPreview) {
            setTimeout(() => {
                if (this.$state.params && this.$state.params.previewObj && this.$state.params.previewObj.id) {
                    this.onAction("view", this.$state.params.previewObj);
                }
            }, 1000);
        }

        this.initJoyRide();
    }

    initJoyRide() {
        setTimeout(() => {
            this.guidance = (this.$state.params && this.$state.params.guidance) ? this.$state.params.guidance : false;
            if (this.guidance) {
                this.startJoyRideCreative = true;
            } else {
                this.startJoyRideCreative = false;
            }

            this.joyrideConfigCreative = [
                {
                    type: "element",
                    selector: "#joyride-create-creativeAds",
                    heading: "Creative Ads",
                    text: "This page shows your <b>Creative Ads</b> which you provide. You can provide HTML code or design from our available templates",
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
        }, 150);
    }

    joyrideFinish(type) {
        if (type === 'skip') {
            this.startJoyRideCreative = false;
            this.$rootScope.createdGuidance = 'closed';
            return;
        }
        return this.$state.go('admin.account', { guidance: true, created: moment().valueOf() });
    }

    modalImageFull(src) {
        const modal = document.querySelector("#modalImage");

        if (src === 'close') {
            modal.style.display = "none";
            return;
        }
        const modalImg = document.querySelector("#imgHtmlCodeExampleModal");
        modal.style.display = "block";
        modalImg.src = src;
    }

    initGrid() {
        this.gridOptions = {
            columnDefs: [
                {
                    headerName: this.$rootScope.isLang === 'VN' ? 'STT' : 'No',
                    field: '',
                    width: 50,
                    suppressSorting: true,
                    cellRenderer: params => params.rowIndex + 1,
                },
                { headerName: this.$rootScope.isLang === 'VN' ? 'Tên' : 'Name', field: 'name', minWidth: 100 },
                {
                    headerName: this.$rootScope.isLang === 'VN' ? 'Chiến dịch' : 'Campaign',
                    width: 150,
                    template: gridCellCampaignTemplate
                },
                { headerName: this.$rootScope.isLang === 'VN' ? 'Loại' : 'Type', field: 'type', width: 100, cellRenderer: params => params.value === 'Banner' ? 'Creative Ads' : params.value },
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
                    minWidth: 175,
                    // maxWidth: 175,
                    cellClass: 'overflow-visible',
                    template: gridCellActionTemplate
                }
            ],
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
        this.gridOptionsForm = {
            ...this.gridOptions,
            columnDefs: [
                {
                    headerName: 'No',
                    field: '',
                    width: 50,
                    suppressSorting: true,
                    cellRenderer: params => params.rowIndex + 1
                },
                {
                    headerName: 'Form Name', field: 'formName', minWidth: 100
                },
                {
                    headerName: 'Created By',
                    field: '',
                    width: 130,
                    cellRenderer: params => (params && params.data) ? (params.data.createdByUsername || '') : ''
                },
                {
                    headerName: 'Updated By',
                    field: '',
                    width: 130,
                    cellRenderer: params => (params && params.data) ? (params.data.updatedByUsername || '') : ''
                },
                {
                    headerName: 'Actions',
                    field: '',
                    suppressSorting: true,
                    minWidth: 175,
                    maxWidth: 175,
                    cellClass: 'overflow-visible',
                    template: gridCellActionTemplateForm
                }
            ],
            onGridReady: this.onGridReadyForm.bind(this)
        };
    }

    onGridData() {
        if (this.mode === 'banner') {
            this.gridApi.setRowData(this.banners);
            this.gridApi.sizeColumnsToFit();
        } else if (this.mode === 'generateForm') {
            this.gridApiForm.setRowData(this.forms);
            this.gridApiForm.sizeColumnsToFit();
        }
    }

    onGridReady(event) {
        this.gridApi = event.api;
        this.onGridData();
    }

    onGridReadyForm(event) {
        this.gridApiForm = event.api;
        this.onGridData();
    }

    updateRow(oldRow, newRow, type) {
        if (!oldRow && newRow) {
            this[type].splice(0, 0, newRow);
        } else {
            const idx = _findIndex(this[type], item => item.id === oldRow.id);
            if (newRow) {
                this[type].splice(idx, 1, newRow);
            } else {
                this[type].splice(idx, 1);
            }
        }
        this.onGridData();
    }

    onAction(action, row, type) {
        switch (action) {
            case 'new':
                if (!this.quickSetup) {
                    $('#fmEdit').modal();
                    this.startJoyRideCreative = false;
                }
            case 'edit':
            case 'view':
            case 'viewInForm':
            case 'viewTab':
            case 'viewCampaign':
            case 'delete':
            case 'refresh':
            case 'newForm':
            case 'editForm':
            case 'deleteForm':
            case 'generateCode':
            case 'addField':
            case 'copyCode':
            case 'removeField':
                this[action](row, type);
                break;
            default:
                break;
        }
    }

    new() {
        this.watchColor();
        this.obj['id'] = null;
        this.obj['name'] = '';
        this.obj['createdBy'] = this.currentUser.id;
        this.obj['type'] = 'Banner';
        this.obj['templateType'] = 'passCode';
        this.obj['passCode'] = '';
        this.defaultTemplates = lodash.cloneDeep(this.templates);
        this.defaultTemplates = this.defaultTemplates.filter(item => (item.type !== 'default' && item.type !== 'video_default'));
        this.editOptions = {};
        this.previewLink = null;
        this.generatedHTML = '';
        this.saveDesign = false;
        this.saveFileTmp = {};
        this.previewCreateMode = true;
        this.sidebarLeft = true;
        this.sidebarRight = true;
        this.useTemplate(null);
        // video
        this.vidEditOptions = {};
        this.vidSaveFileTmp = {};
        this.vidGeneratedHTML = '';
        this.vidSidebarRight = true;
        this.vidSaveDesign = false;
        this.vidWatchColor();
    }

    closeModal() {
        this.$rootScope.createdGuidance = 'closed';
    }

    vidWatchColor() {
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.body && this.objVideo.options.body.backgroundColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.backgroundColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.color), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.borderColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.borderTopColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.borderRightColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.borderBottomColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
        this.$scope.$watch(() => (this.objVideo && this.objVideo.options && this.objVideo.options.btn && this.objVideo.options.btn.borderLeftColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onVideoChangeSettings(); } });
    }

    watchColor() {
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.body && this.obj.options.body.backgroundColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.backgroundColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.color), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.borderColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.borderTopColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.borderRightColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.borderBottomColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.borderLeftColor), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
        this.$scope.$watch(() => (this.obj && this.obj.options && this.obj.options.btn && this.obj.options.btn.fontWeight), (newVal, oldVal) => { if (newVal && oldVal && (newVal !== oldVal)) { this.onChangeSettings(); } });
    }

    newForm() {
        this.userData = { method: 'POST', actionurl: '/login', generateCode: '', survey: [], createdBy: this.currentUser.id };
    }

    editForm(row) {
        this.userData = { ...row };
        delete this.obj.$promise;
        delete this.obj.$resolved;
    }

    deleteForm(row) {
        this.alertify.confirm(this.Messages.confirmDelete.format(`form ${row.formName}`), () => {
            this.FormGenerate
                .deleteById({ id: row.id }).$promise
                .then(() => {
                    this.alertify.success(this.Messages.deleteSuccess);
                    this.updateRow(row, '', 'forms');
                }).catch(() => {
                    this.alertify.error(this.Messages.deleteFailed);
                });
        }, () => {
            this.alertify.log('You cancelled');
        });
    }

    generateCode() {
        if (this.userData.id) {
            this.FormGenerate.replaceById(this.userData).$promise
                .then((savedObj) => {
                    this.alertify.success(this.Messages.updateSuccess);
                    this.updateRow(this.userData, savedObj, 'forms');
                    this.obj = savedObj;
                    this.userData.generateCode = Generate(this.userData);
                })
                .catch(() => {
                    this.alertify.error(this.Messages.updateFailed);
                });
        } else {
            this.FormGenerate.create(this.userData).$promise
                .then((savedObj) => {
                    this.alertify.success(this.Messages.createSuccess);
                    this.updateRow(null, savedObj, 'forms');
                    this.obj = savedObj;
                    this.userData.generateCode = Generate(this.userData);
                })
                .catch(() => {
                    this.alertify.error(this.Messages.createFailed);
                });
        }
    }

    copyCode(type) {
        type ? document.getElementById(type).select() : document.getElementById('code').select();

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

    addField() {
        this.userData.survey = [...this.userData.survey, `field${this.userData.survey.length}`];
    }
    removeField(idx) {
        this.userData.survey = [...this.userData.survey.slice(0, idx), ...this.userData.survey.slice(idx + 1)];
    }

    viewCampaign(row) {
        const baseFilters = {
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
            visitTime: 'Visit Time',
            range: 'Range',
            voucher: 'Voucher'
        };
        let baseValue = {
            $$hasValue: 'Has value',
            $$noValue: 'Has no value',
            2: 'Max 2 times',
            20: 'Max 2 times each Location',
            6: 'Max 6 times',
            60: 'Max 6 times each Location',
            10: 'Max 10 times',
            100: 'Max 10 times each Location'
        };
        const baseValueTime = {
            0: 'First Time',
            1: 'Second Time',
            2: 'Third Time',
            3: 'Fourth Time',
            4: 'Fifth Time',
        };
        this.campaigns.forEach((cam) => {
            cam.customFields.forEach((fie) => {
                baseFilters[fie.fieldName] = fie.displayName;
            });
            baseValue[cam.id] = cam.name;
        });
        baseValue = _merge(
            baseValue,
            this.ages,
            this.genders,
            this.devices,
            this.oses,
            this.incomes,
            this.websiteCats,
        );
        const banners = this.bannerMap[row.id] ? this.bannerMap[row.id] : [];
        const renderRange = function (fil) {
            let text;
            if (fil.value.type === 'datetime') {
                text = 'From ' + moment(fil.value.scheduleFrom).format('MMM DD') + ' -> ' + moment(fil.value.scheduleTo).format('MMM DD, YYYY');
                if (fil.value.startTime) {
                    text += ' At ' + fil.value.startTime.pad() + 'h -> ' + fil.value.endTime.pad() + 'h';
                }
            } else {
                text = 'From ' + fil.value.startTime.pad() + 'h -> ' + fil.value.endTime.pad() + 'h everyday';
            }
            return text;
        };
        banners.forEach((ban) => {
            if (ban.filters) {
                if (ban.filters[0].and) {
                    ban.filterRender = ban.filters[0].and.map((fil) => {
                        if (fil.field === 'visitTime') {
                            return baseFilters[fil.field] + ': ' + fil.value.map((i) => baseValueTime[i]).toString();
                        }
                        if (fil.field === 'range') {
                            return renderRange(fil);
                        }
                        return baseFilters[fil.field] + ': ' + fil.value.map((i) => baseValue[i]).toString();
                    }).join(' & ');
                } else {
                    ban.filterRender = ban.filters[0].or.map((fil) => {
                        if (fil.field === 'visitTime') {
                            return baseFilters[fil.field] + ': ' + fil.value.map((i) => baseValueTime[i]).toString();
                        }
                        if (fil.field === 'range') {
                            return baseFilters[fil.field] + ': ' + renderRange(fil);
                        }
                        return baseFilters[fil.field] + ': ' + fil.value.map((i) => baseValue[i]).toString();
                    }).join(' OR ');
                }
            } else {
                ban.filterRender = 'Default';
            }
        });
        this.objCampaigns = banners;
    }

    view(row) {
        this.previewLink = null;
        $('#fmPreview').modal();

        if (row.id) {
            this.previewCreateMode = false;
            this.previewLink = `${location.origin}/api/banners/${row.id}/preview`;
        } else {
            this.previewCreateMode = true;
        }
        this.changeViewMode();
    }

    viewInForm(row) {
        this.previewLink = null;
        $('#fmPreview').modal();

        this.previewCreateMode = true;
        this.changeViewMode();
    }

    viewTab(row) {
        const urlBase = this.LoopBackResource.getUrlBase().replace(/^https/i, 'http');
        this.$window.open(`${urlBase}/banners/${row.id}/preview`, '_blank');
    }

    changeViewMode(mode) {
        let iframe = document.createElement('iframe');
        const container = document.getElementById('previewLink');

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
        iframe.width = '100%';
        iframe.style.marginTop = '1px';
        iframe.style.border = '1px solid darkgray';
        iframe.style.overflow = 'hidden';

        if (container.childNodes[0]) {
            container.removeChild(container.childNodes[0]);
        }
        container.appendChild(iframe);

        if (this.previewCreateMode) {
            iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
            iframe.document.open();
            iframe.document.write('');

            setTimeout(() => {
                switch (this.obj.templateType) {
                    case 'passCode':
                        iframe.document.write(this.obj.passCode || '');
                        break;
                    case 'static':
                        iframe.document.write(this.generatedHTML || '');
                        break;
                    case 'video':
                        iframe.document.write(this.vidGeneratedHTML || '');
                        break;
                    default:
                        iframe.document.write('');
                        break;
                }
                iframe.document.close();
            }, 600);
        } else {
            iframe.src = null;
            setTimeout(() => {
                iframe.src = this.previewLink || '';
            }, 600);
        }

        this.previewMode = mode;
    }

    closeFrame() {
        const container = document.getElementById('previewLink');
        container.childNodes[0].src = '';
        $('#fmPreview').modal('hide');
    }

    setLoginCode(html) {
        html = html.replace('</body>', `${this.bodyScript}</body>`);
        return html;
    }

    replaceImage({ laptop, mobile }) {
        let iframe = document.querySelector('iframe#template-generate');
        if (iframe) {
            iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

            if (iframe.document) {
                const document = iframe.document;

                if (document.querySelector('html')) {
                    if (laptop) {
                        document.querySelector('.img-responsive-desktop').src = laptop || '';
                    }

                    if (mobile) {
                        document.querySelector('.img-responsive-mobile').src = mobile || '';
                    }
                    this.generatedHTML = `<!DOCTYPE html><html lang="en">${document.querySelector('html').innerHTML}</html>`;
                }
            }
        }
    }

    checkCloud() {
        const params = new URLSearchParams();
        params.append('username', this.currentUser.id);
        params.append('password', this.currentUser.id);

        return axios.post(
            `${this.AppConfig.cloudcmd.resourceUrl}/api/users/loginCustom`,
            params,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                withCredentials: true
            },
        );
    }

    requestUploadCloud(file, accessToken) {
        return new Promise((resolve, reject) => {
            const ext = file.name.substring(file.name.lastIndexOf('.'));
            let fileName = `staticImg_${Date.now() + ext}`;
            if ((ext === '.mp4' || ext === '.ogg' || ext === '.ogv' || ext === '.webm')) {
                fileName = `staticVideo_${Date.now() + ext}`;
            }
            const xhr = new XMLHttpRequest();
            let path = this.AppConfig.cloudcmd.mountPath;
            let returnPath = this.AppConfig.cloudcmd.resourcePath;

            if (this.currentUser.profileName === 'superadmin') {
                path = this.AppConfig.cloudcmd.mountPath;
                returnPath = this.AppConfig.cloudcmd.resourcePath;
            } else {
                if (this.currentUser.rootdir) {
                    path = `${this.AppConfig.cloudcmd.mountPath}${this.currentUser.rootdir}`;
                    returnPath = `${this.AppConfig.cloudcmd.resourcePath}${this.currentUser.rootdir}`;
                } else {
                    path = `${this.AppConfig.cloudcmd.mountPath}/${this.currentUser.username}`;
                    returnPath = `${this.AppConfig.cloudcmd.resourcePath}/${this.currentUser.username}`;
                }
            }

            xhr.open('PUT', `${this.AppConfig.cloudcmd.resourceUrl}${path}/${fileName}`);
            xhr.setRequestHeader('Authorization', accessToken);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(`${this.AppConfig.cloudcmd.resourceUrl}${returnPath}/${fileName}`);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send(file);
        });
    }

    logoutCloud(accessToken) {
        return axios.post(
            `${this.AppConfig.cloudcmd.resourceUrl}/api/users/logout`,
            '',
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: accessToken },
                withCredentials: true
            },
        );
    }

    uploadFileToCloud(data, saveObj) {
        if (!lodash.isEmpty(data)) {
            return this.checkCloud()
                .then(pass => {
                    if (pass && pass.data.access_token) {
                        return Promise.all([
                            data.laptop ? this.requestUploadCloud(data.laptop, pass.data.access_token) : '',
                            data.mobile ? this.requestUploadCloud(data.mobile, pass.data.access_token) : '',
                            pass.data.access_token
                        ]);
                    }
                    return [];
                })
                .then(([laptop, mobile, accessToken]) => {
                    this.replaceImage({ laptop: laptop ? laptop : '', mobile: mobile ? mobile : '' });
                    setTimeout(() => {
                        this.saveDB(saveObj, laptop, mobile, accessToken);
                    }, 1500);
                })
                .catch(err => {
                    if (this.obj.id) {
                        this.alertify.error(this.Messages.updateFailed);
                    } else {
                        this.alertify.error(this.Messages.createFailed);
                    }
                    document.querySelector('#overlayBg').style.display = 'none';
                });
        }
        return this.saveDB(saveObj);
    }

    saveDB(saveObj, imgReplaceLaptop, imgReplaceMobile, accessToken) {
        saveObj.htmlCode = this.setLoginCode(this.generatedHTML);
        saveObj.options = lodash.cloneDeep(this.objTemplates);
        if (imgReplaceLaptop) {
            saveObj.options['laptop']['bgImage'] = imgReplaceLaptop;
        }

        if (imgReplaceMobile) {
            saveObj.options['mobile']['bgImage'] = imgReplaceMobile;
        }

        saveObj.options['staticBannerType'] = saveObj.staticBannerType;
        saveObj.options['staticBannerId'] = saveObj.staticBannerId;
        saveObj.options['templateType'] = saveObj.templateType;

        saveObj = lodash.omit(saveObj, 'staticBannerType');
        saveObj = lodash.omit(saveObj, 'staticBannerId');
        saveObj = lodash.omit(saveObj, 'passCode');
        saveObj = lodash.omit(saveObj, 'templateType');
        saveObj = lodash.omit(saveObj, 'id');

        this.generatedHTML = '';
        this.saveFileTmp = {};
        this.saveDesign = false;

        if (document.getElementById('generateHTML').childNodes[0]) {
            document.getElementById('generateHTML').childNodes[0].src = '';
        }

        if (this.obj.id) {
            saveObj.updatedAt = moment().valueOf();

            this.Banner.replaceById({ id: this.obj.id }, saveObj).$promise
                .then((data) => {
                    this.alertify.success(this.Messages.updateSuccess);
                    delete data.$promise;
                    delete data.$resolved;
                    this.updateRow(this.obj, data, 'banners');
                    this.mode = 'banner';
                    $('#fmEdit').modal('hide');
                })
                .catch(() => {
                    this.alertify.error(this.Messages.updateFailed);
                }).finally(() => {
                    document.querySelector('#overlayBg').style.display = 'none';
                });
        } else {
            saveObj.createdAt = moment().valueOf();
            saveObj.updatedAt = moment().valueOf();

            this.Banner.create(saveObj).$promise
                .then((data) => {
                    this.alertify.success(this.Messages.createSuccess);
                    this.updateRow(null, data, 'banners');
                    this.mode = 'banner';
                    $('#fmEdit').modal('hide');

                    if (this.quickSetup) {
                        this.$rootScope.$broadcast(this.AuthEvents.creativeQuickSetup, data);
                    }
                })
                .catch(() => {
                    this.alertify.error(this.Messages.createFailed);
                }).finally(() => {
                    document.querySelector('#overlayBg').style.display = 'none';
                    setTimeout(() => {
                        if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
                            return this.$state.go('admin.account', { guidance: true, created: moment().valueOf() });
                        }
                    }, 50);
                });
        }

        if (accessToken) {
            this.logoutCloud(accessToken);
        }
    }

    create() {
        this.saveDesign = false;
        document.querySelector('#overlayBg').style.display = 'block';
        let saveObj = lodash.cloneDeep(this.obj);
        if (saveObj.templateType === 'passCode') {
            saveObj.htmlCode = saveObj.passCode;
            saveObj.options = {};
        }
        if (saveObj.templateType === 'static') {
            return this.uploadFileToCloud(this.saveFileTmp, saveObj);
        }

        saveObj.options['staticBannerType'] = saveObj.staticBannerType;
        saveObj.options['staticBannerId'] = saveObj.staticBannerId;
        saveObj.options['templateType'] = saveObj.templateType;

        saveObj = lodash.omit(saveObj, 'staticBannerType');
        saveObj = lodash.omit(saveObj, 'staticBannerId');
        saveObj = lodash.omit(saveObj, 'passCode');
        saveObj = lodash.omit(saveObj, 'templateType');
        saveObj = lodash.omit(saveObj, 'id');

        this.generatedHTML = '';
        this.saveFileTmp = {};

        if (document.getElementById('generateHTML').childNodes[0]) {
            document.getElementById('generateHTML').childNodes[0].src = '';
        }

        if (this.obj.id) {
            saveObj.updatedAt = moment().valueOf();

            this.Banner.replaceById({ id: this.obj.id }, saveObj).$promise
                .then((data) => {
                    this.alertify.success(this.Messages.updateSuccess);
                    delete data.$promise;
                    delete data.$resolved;
                    this.updateRow(this.obj, data, 'banners');
                    this.mode = 'banner';
                    $('#fmEdit').modal('hide');
                })
                .catch(() => {
                    this.alertify.error(this.Messages.updateFailed);
                }).finally(() => {
                    document.querySelector('#overlayBg').style.display = 'none';
                });
        } else {
            saveObj.createdAt = moment().valueOf();
            saveObj.updatedAt = moment().valueOf();

            this.Banner.create(saveObj).$promise
                .then((data) => {
                    this.alertify.success(this.Messages.createSuccess);
                    this.updateRow(null, data, 'banners');
                    this.mode = 'banner';
                    $('#fmEdit').modal('hide');

                    if (this.quickSetup) {
                        this.$rootScope.$broadcast(this.AuthEvents.creativeQuickSetup, data);
                    }
                })
                .catch(() => {
                    this.alertify.error(this.Messages.createFailed);
                }).finally(() => {
                    document.querySelector('#overlayBg').style.display = 'none';
                    setTimeout(() => {
                        if (this.$rootScope && this.$rootScope.createdGuidance && this.$rootScope.createdGuidance === 'started') {
                            return this.$state.go('admin.account', { guidance: true, created: moment().valueOf() });
                        }
                    }, 50);
                });
        }
    }

    edit(row) {
        this.quickSetup = false;
        const cloneRow = lodash.cloneDeep(row);
        const isTemplateType = lodash.get(cloneRow, 'options.templateType', 'passCode');
        this.vidWatchColor();
        this.watchColor();
        this.defaultTemplates = lodash.cloneDeep(this.templates);
        this.defaultTemplates = this.defaultTemplates.filter(item => (item.type !== 'default' && item.type !== 'video_default'));
        this.generatedHTML = '';
        this.saveDesign = false;
        this.saveFileTmp = {};
        this.editOptions = {};
        this.previewCreateMode = false;
        this.obj = {};
        this.objVideo = {};
        this.vidEditOptions = cloneRow;

        lodash.set(this.obj, 'id', lodash.get(cloneRow, 'id', ''));
        lodash.set(this.obj, 'templateType', lodash.get(cloneRow, 'options.templateType', 'passCode'));
        lodash.set(this.obj, 'createdBy', lodash.get(cloneRow, 'createdBy', this.currentUser.id));

        if (isTemplateType === 'video') {
            //video
            lodash.set(this.obj, 'name', lodash.get(cloneRow, 'name', ''));
            lodash.set(this.obj, 'type', lodash.get(cloneRow, 'type', ''));
            lodash.set(this.obj, 'htmlCode', '');
            lodash.set(this.obj, 'staticBannerType', 'default');
            lodash.set(this.obj, 'staticBannerId', null);
        } else {
            lodash.set(this.obj, 'name', lodash.get(cloneRow, 'name', ''));
            lodash.set(this.obj, 'type', lodash.get(cloneRow, 'type', ''));
            lodash.set(this.obj, 'htmlCode', lodash.get(cloneRow, 'htmlCode', ''));
            lodash.set(this.obj, 'staticBannerType', lodash.get(cloneRow, 'options.staticBannerType', 'default'));
            lodash.set(this.obj, 'staticBannerId', lodash.get(cloneRow, 'options.staticBannerId', null));

            this.editOptions = lodash.get(cloneRow, 'options', {});
            this.editOptions = lodash.omit(this.editOptions, 'templateType');
            this.editOptions = lodash.omit(this.editOptions, 'staticBannerType');
            this.editOptions = lodash.omit(this.editOptions, 'staticBannerId');
        }

        if (this.obj.templateType === 'passCode') {
            this.obj['passCode'] = this.obj.htmlCode;
            this.useTemplate(null);
        } else if (this.obj.templateType === 'static') {
            let templates = lodash.cloneDeep(this.templates);
            templates = templates.filter(item => item.id === this.obj.staticBannerId);
            if (templates && templates.length) {
                this.obj['htmlCode'] = templates[0].htmlCode;
            } else {
                this.obj['htmlCode'] = '';
            }

            this.obj['passCode'] = '';
            this.onChooseTemplate('static');
        } else if (this.obj.templateType === 'video') {
            this.obj['passCode'] = '';
            this.onChooseTemplate('video');
        } else {
            this.obj['passCode'] = '';
            this.useTemplate(null);
        }
        $('#fmEdit').modal();
    }

    delete(row) {
        let haveCampaign = this.bannerMap[row.id] ? true : false, messages;
        if (haveCampaign) {
            messages = this.Messages.confirmInvalidCampaign.format(`banner ${row.name}`, this.bannerMap[row.id].map(({ name }) => name).toString());
        } else {
            messages = this.Messages.confirmDelete.format(`banner ${row.name}`);
        }
        this.alertify.confirm(messages, () => {
            this.Banner
                .deleteById({ id: row.id }).$promise
                .then(() => {
                    if (haveCampaign) {
                        Promise.each(this.bannerMap[row.id], (camp) => {
                            this.Campaign.updateAll({ where: { id: camp.id } }, { status: 'invalid' });
                        }).catch((err) => this.alertify.error('Update campaign failed!'));
                    }
                    this.alertify.success(this.Messages.deleteSuccess);
                    this.updateRow(row, '', 'banners');
                }).catch(() => {
                    this.alertify.error(this.Messages.deleteFailed);
                });
        }, () => {
            this.alertify.log('You cancelled');
        });
    }

    async refresh() {
        let query = {};
        if (this.currentUser.profileName === 'admin') {
            const users = await this.User.find().$promise;
            query = {
                where: {
                    or: [
                        { createdBy: this.currentUser.id },
                        ...users.map((usr) => ({ createdBy: usr.id }))
                    ]
                }
            };
        } else if (this.currentUser.profileName !== 'superadmin') {
            query = { where: { createdBy: this.currentUser.id } };
        }
        if (this.mode === 'banner') {
            this.Campaign.find({ filter: query }).$promise.then((campaigns) => {
                this.bannerMap = {};
                campaigns.forEach((camp) => {
                    if (!this.bannerMap[camp.bannerDefaultId]) {
                        this.bannerMap[camp.bannerDefaultId] = [{ name: camp.name, id: camp.id }];
                    } else {
                        this.bannerMap[camp.bannerDefaultId].push({ name: camp.name, id: camp.id });
                    }
                    if (camp.banners) {
                        camp.banners.forEach((campC) => {
                            if (!this.bannerMap[campC.bannerId]) {
                                this.bannerMap[campC.bannerId] = [{ name: camp.name, id: camp.id, filters: campC.filters }];
                            } else {
                                this.bannerMap[campC.bannerId].push({ name: camp.name, id: camp.id, filters: campC.filters });
                            }
                        });
                    }
                });
            });
            this.Banner
                .find({ filter: query }).$promise
                .then((banners) => {
                    this.banners = banners;
                    this.onGridData();
                    this.obj = {};

                    this.alertify.success(this.Messages.refreshSuccess);
                });
        } else if (this.mode === 'generateForm') {
            this.FormGenerate
                .find({ filter: query }).$promise
                .then((forms) => {
                    this.forms = forms;
                    this.onGridData();
                    this.obj = {};

                    this.alertify.success(this.Messages.refreshSuccess);
                });
        }
    }

    compareImage(widthTemplate, heightTemplate, widthFile, heightFile) {
        const ratioTemplate = parseFloat((widthTemplate / heightTemplate).toFixed(2));
        const ratioFile = parseFloat((widthFile / heightFile).toFixed(2));
        if (ratioTemplate == ratioFile) {
            return true;
        }
        return false;
    }

    handleUploadFileServer(file) {
        if (this.staticImgPreviewMode === 'Laptop') {
            this.saveFileTmp['laptop'] = file;
        } else {
            this.saveFileTmp['mobile'] = file;
        }
        this.obj.options.bgImage = file.preview;
        this.onChangeSettings();
    }

    onOpenCloud() {
        this.mode = 'fileManager';
        const iframe = document.createElement('iframe');
        iframe.id = 'iframeInner';
        iframe.src = this.AppConfig.cloudcmd.resourceUrl + '/cloudcmd' + '?userId=' + this.currentUser.id;
        iframe.width = '100%';
        iframe.height = '700px';
        setTimeout(() => {
            const container = document.getElementById('frameCloud');
            if (container.childNodes[0]) {
                container.removeChild(container.childNodes[0]);
            }
            container.appendChild(iframe);
        }, 50);
    }

    onOpenSidebar(type) {
        if (type === 'right') {
            this.sidebarRight = !this.sidebarRight;
            Dropzone.autoDiscover = false;
            const that = this;

            const dropzone = new Dropzone('#dropzone', {
                url: '/uploads',
                paramName: 'file',
                maxFiles: 1,
                maxFilesize: 12,
                acceptedFiles: 'image/*',
                dictDefaultMessage: this.$rootScope.isLang === 'VN' ? 'Kéo thả hình ảnh vào đây hoặc click để chọn hình ảnh cần upload' : 'Drop a new image here, or click to select files to upload.',
                accept: function (file, done) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        const image = new Image();
                        image.src = URL.createObjectURL(file);

                        image.onload = () => {
                            file.preview = URL.createObjectURL(file);

                            if (file.size > 4194304) {
                                const convertMB = (file.size / 1024 / 1024).toFixed(2);
                                that.Notification.error({ message: `file size: ${convertMB} MB > maximum: 4 MB`, positionY: 'top', positionX: 'right' });
                                return;
                            }

                            if (that.staticImgPreviewMode === 'Laptop') {
                                if (that.compareImage(1625, 935, image.width, image.height)) {
                                    that.handleUploadFileServer(file);
                                    return;
                                }

                                if (that.$rootScope.isLang === 'VN') {
                                    that.Notification.error({ message: 'Vui lòng upload hình ảnh theo tỉ lệ 1625 x 935 (rộng x cao)', positionY: 'top', positionX: 'right' });
                                } else {
                                    that.Notification.error({ message: 'Please upload image with 1625 x 935 (width x height) aspect ratio', positionY: 'top', positionX: 'right' });
                                }

                                return;
                            } else {
                                if (that.compareImage(800, 1250, image.width, image.height)) {
                                    that.handleUploadFileServer(file);
                                    return;
                                }

                                if (that.$rootScope.isLang === 'VN') {
                                    that.Notification.error({ message: 'Vui lòng upload hình ảnh theo tỉ lệ 800 x 1250 (rộng x cao)', positionY: 'top', positionX: 'right' });
                                } else {
                                    that.Notification.error({ message: 'Please upload image with 800 x 1250 (width x height) aspect ratio', positionY: 'top', positionX: 'right' });
                                }
                                return;
                            }
                        };
                    };

                    reader.readAsDataURL(file);
                    done(new Error());
                },
            });

            dropzone.on('complete', function (file) {
                dropzone.removeAllFiles(true);
            });
            return;
        } else {
            this.sidebarLeft = !this.sidebarLeft;
        }

        this.defaultTemplates.map((item, index) => {
            const iframe = document.createElement('iframe');
            iframe.width = '95%';
            iframe.height = '200px';
            iframe.style.border = 'none';
            iframe.style.margin = '5px';
            iframe.src = null;

            setTimeout(() => {
                const container = document.getElementById(`frameLi-${index}`);
                if (container.childNodes[0]) {
                    container.removeChild(container.childNodes[0]);
                }
                container.appendChild(iframe);
                this.onInsertTemplates(item, `frameLi-${index}`);
            }, 50);
        });
    }

    onChooseTemplate(type) {
        this.obj.templateType = type;
        if (type === 'static') {
            if (!this.saveDesign) {
                this.useTemplate(null);
            }
            $('#fmStaticBanner').modal();
        }

        if (type === 'video') {
            $('#fmVideoBanner').modal();

            if (lodash.isEmpty(this.vidEditOptions)) {
                this.vidUseTemplate(null);
            } else {
                this.vidUseTemplate('editVideo', this.vidEditOptions);
            }
        }
    }

    onInsertTemplates(item, byId) {
        const container = document.getElementById(byId);
        let iframe = container.childNodes[0];
        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        iframe.document.open();
        iframe.document.write('');

        setTimeout(() => {
            if (item) {
                iframe.document.write(item.htmlCode);
            } else {
                iframe.document.write('');
            }
            iframe.document.close();
        }, 600);
    }

    onCarousel(type) {
        const el = document.getElementById('owl-carousel');

        if (type === 'prev') {
            el.scroll({
                top: el.scrollTop - 400,
                behavior: 'smooth'
            });
        } else {
            el.scroll({
                top: 400 + el.scrollTop,
                behavior: 'smooth'
            });
        }
    }

    useTemplate(template) {
        this.objTemplates = {};

        if (template === 'new') {
            const clonedefaultTemplate = lodash.cloneDeep(this.templates.filter(item => item.type === 'default')[0]);
            this.obj.staticBannerType = clonedefaultTemplate.type;
            this.obj.staticBannerId = clonedefaultTemplate.id;
            this.obj.htmlCode = clonedefaultTemplate.htmlCode;
            this.objTemplates = clonedefaultTemplate.options;
            this.editHandleMode('Laptop');
            return;
        }

        if (!template) {
            if (lodash.isEmpty(this.editOptions)) {
                const clonedefaultTemplate = lodash.cloneDeep(this.templates.filter(item => item.type === 'default')[0]);
                this.obj.staticBannerType = clonedefaultTemplate.type;
                this.obj.staticBannerId = clonedefaultTemplate.id;
                this.obj.htmlCode = clonedefaultTemplate.htmlCode;
                this.objTemplates = clonedefaultTemplate.options;
            } else {
                this.objTemplates = lodash.cloneDeep(this.editOptions);
            }
            this.editHandleMode('Laptop');
            return;
        }

        const cloneTemplate = lodash.cloneDeep(template);
        this.obj.staticBannerType = cloneTemplate.type;
        this.obj.staticBannerId = cloneTemplate.id;
        this.obj.htmlCode = cloneTemplate.htmlCode;
        this.objTemplates = cloneTemplate.options;
        this.editHandleMode('Laptop');
    }

    resetObjOptions(settings) {
        this.obj.options = {
            body: {
                backgroundColor: lodash.get(settings, 'backgroundColor', '#ffffff'),
                fontFamily: lodash.get(settings, 'fontFamily', 'Montserrat, sans-serif'),
            },
            bgImage: lodash.get(settings, 'bgImage', ''),
            sizeImage: lodash.get(settings, 'sizeImage', '50%'),
            btn: {
                text: lodash.get(settings, 'text', 'Connect Internet'),
                fontWeight: lodash.get(settings, 'btn.fontWeight', 'bolder'),
                color: lodash.get(settings, 'btn.color', '#ffffff'),
                backgroundColor: lodash.get(settings, 'btn.backgroundColor', '#3aaee0'),
                textAlign: lodash.get(settings, 'btn.textAlign', 'center'),
                xDirection: lodash.get(settings, 'btn.xDirection', '0%'),
                yDirection: lodash.get(settings, 'btn.yDirection', '0%'),
                borderStyle: lodash.get(settings, 'btn.borderStyle', '0px'),
                borderWidth: lodash.get(settings, 'btn.borderWidth', 'solid'),
                borderColor: lodash.get(settings, 'btn.borderColor', '#cccccc'),
                borderTopStyle: lodash.get(settings, 'btn.borderTopStyle', '0px'),
                borderTopWidth: lodash.get(settings, 'btn.borderTopWidth', 'solid'),
                borderTopColor: lodash.get(settings, 'btn.borderTopColor', '#cccccc'),
                borderRightStyle: lodash.get(settings, 'btn.borderRightStyle', '0px'),
                borderRightWidth: lodash.get(settings, 'btn.borderRightWidth', 'solid'),
                borderRightColor: lodash.get(settings, 'btn.borderRightColor', '#cccccc'),
                borderBottomStyle: lodash.get(settings, 'btn.borderBottomStyle', '0px'),
                borderBottomWidth: lodash.get(settings, 'btn.borderBottomWidth', 'solid'),
                borderBottomColor: lodash.get(settings, 'btn.borderBottomColor', '#cccccc'),
                borderLeftStyle: lodash.get(settings, 'btn.borderLeftStyle', '0px'),
                borderLeftWidth: lodash.get(settings, 'btn.borderLeftWidth', 'solid'),
                borderLeftColor: lodash.get(settings, 'btn.borderLeftColor', '#cccccc'),
                borderRadius: lodash.get(settings, 'btn.borderRadius', '4px'),
                padding: lodash.get(settings, 'btn.padding', '10px'),
                paddingTop: lodash.get(settings, 'btn.paddingTop', '10px'),
                paddingRight: lodash.get(settings, 'btn.paddingRight', '10px'),
                paddingBottom: lodash.get(settings, 'btn.paddingBottom', '10px'),
                paddingLeft: lodash.get(settings, 'btn.paddingLeft', '10px'),
            },
            btnBorderOption: lodash.get(settings, 'btnBorderOption', 'allsides'),
            btnPaddingOption: lodash.get(settings, 'btnPaddingOption', 'allsides'),
        };
        this.onChangeSettings();
    }

    onSettingWithMode(mode) {
        if (mode === 'Laptop') {
            if (this.objTemplates && this.objTemplates.laptop) {
                this.resetObjOptions(Object.assign({}, lodash.get(this.objTemplates, 'btn', {}), lodash.get(this.objTemplates, 'body', {}), lodash.get(this.objTemplates, 'laptop', {})));
            }
        } else {
            if (this.objTemplates && this.objTemplates.mobile) {
                this.resetObjOptions(Object.assign({}, lodash.get(this.objTemplates, 'btn', {}), lodash.get(this.objTemplates, 'body', {}), lodash.get(this.objTemplates, 'mobile', {})));
            }
        }
    }

    editHandleMode(mode) {
        this.staticImgPreviewMode = mode;

        let iframe = document.createElement('iframe');
        iframe.id = 'template-choosed';
        if (mode === 'Laptop') {
            iframe.width = '100%';
            iframe.height = '800px';
            iframe.style.border = 'none';
            this.onSettingWithMode('Laptop');
        } else {
            iframe.width = '100%';
            iframe.height = '640px';
            iframe.style.border = 'none';
            this.onSettingWithMode('Mobile');
        }

        const container = document.getElementById('edit-handle-area');
        if (container.childNodes[0]) {
            container.removeChild(container.childNodes[0]);
        }
        container.appendChild(iframe);
        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        iframe.document.open();
        iframe.document.write('');
        iframe.document.write(this.obj.htmlCode);
        iframe.document.close();
    }

    onCalPlusMinus(cssProp, value) {
        if (this.obj.options.btn[cssProp].includes('%')) {
            if (value === 'minus') {
                value = parseInt(this.obj.options.btn[cssProp].slice(0, -1)) - 1;
            }

            if (value === 'plus') {
                value = parseInt(this.obj.options.btn[cssProp].slice(0, -1)) + 1;
            }
            return `${value}%`;
        } else if (this.obj.options.btn[cssProp].includes('px')) {
            if (value === 'minus') {
                value = parseInt(this.obj.options.btn[cssProp].slice(0, -2)) - 1;
                value = (value < 0) ? 0 : value;
            }

            if (value === 'plus') {
                value = parseInt(this.obj.options.btn[cssProp].slice(0, -2)) + 1;
            }
            return `${value}px`;
        }
        return this.obj.options.btn[cssProp];
    }

    resetObjTemplates(mode) {
        this.onResetTemplate(this.obj.options);

        if (mode === 'laptop') {
            lodash.set(this.objTemplates, `${mode}.sizeImage`, this.obj.options.sizeImage);
        } else {
            lodash.set(this.objTemplates, `${mode}.sizeImage`, '');
        }

        lodash.set(this.objTemplates, 'btn.text', this.obj.options.btn.text);
        lodash.set(this.objTemplates, 'body.backgroundColor', this.obj.options.body.backgroundColor);
        lodash.set(this.objTemplates, 'body.fontFamily', this.obj.options.body.fontFamily);
        lodash.set(this.objTemplates, `${mode}.fontWeight`, this.obj.options.btn.fontWeight);
        lodash.set(this.objTemplates, `${mode}.bgImage`, this.obj.options.bgImage);
        lodash.set(this.objTemplates, `${mode}.btnBorderOption`, this.obj.options.btnBorderOption);
        lodash.set(this.objTemplates, `${mode}.btnPaddingOption`, this.obj.options.btnPaddingOption);
        lodash.set(this.objTemplates, `${mode}.btn.color`, this.obj.options.btn.color);
        lodash.set(this.objTemplates, `${mode}.btn.backgroundColor`, this.obj.options.btn.backgroundColor);
        lodash.set(this.objTemplates, `${mode}.btn.textAlign`, this.obj.options.btn.textAlign);
        lodash.set(this.objTemplates, `${mode}.btn.xDirection`, this.obj.options.btn.xDirection);
        lodash.set(this.objTemplates, `${mode}.btn.yDirection`, this.obj.options.btn.yDirection);
        lodash.set(this.objTemplates, `${mode}.btn.borderStyle`, this.obj.options.btn.borderStyle);
        lodash.set(this.objTemplates, `${mode}.btn.borderWidth`, this.obj.options.btn.borderWidth);
        lodash.set(this.objTemplates, `${mode}.btn.borderColor`, this.obj.options.btn.borderColor);
        lodash.set(this.objTemplates, `${mode}.btn.borderTopStyle`, this.obj.options.btn.borderTopStyle);
        lodash.set(this.objTemplates, `${mode}.btn.borderTopWidth`, this.obj.options.btn.borderTopWidth);
        lodash.set(this.objTemplates, `${mode}.btn.borderTopColor`, this.obj.options.btn.borderTopColor);
        lodash.set(this.objTemplates, `${mode}.btn.borderRightStyle`, this.obj.options.btn.borderRightStyle);
        lodash.set(this.objTemplates, `${mode}.btn.borderRightWidth`, this.obj.options.btn.borderRightWidth);
        lodash.set(this.objTemplates, `${mode}.btn.borderRightColor`, this.obj.options.btn.borderRightColor);
        lodash.set(this.objTemplates, `${mode}.btn.borderBottomStyle`, this.obj.options.btn.borderBottomStyle);
        lodash.set(this.objTemplates, `${mode}.btn.borderBottomWidth`, this.obj.options.btn.borderBottomWidth);
        lodash.set(this.objTemplates, `${mode}.btn.borderBottomColor`, this.obj.options.btn.borderBottomColor);
        lodash.set(this.objTemplates, `${mode}.btn.borderLeftStyle`, this.obj.options.btn.borderLeftStyle);
        lodash.set(this.objTemplates, `${mode}.btn.borderLeftWidth`, this.obj.options.btn.borderLeftWidth);
        lodash.set(this.objTemplates, `${mode}.btn.borderLeftColor`, this.obj.options.btn.borderLeftColor);
        lodash.set(this.objTemplates, `${mode}.btn.borderRadius`, this.obj.options.btn.borderRadius);
        lodash.set(this.objTemplates, `${mode}.btn.padding`, this.obj.options.btn.padding);
        lodash.set(this.objTemplates, `${mode}.btn.paddingTop`, this.obj.options.btn.paddingTop);
        lodash.set(this.objTemplates, `${mode}.btn.paddingRight`, this.obj.options.btn.paddingRight);
        lodash.set(this.objTemplates, `${mode}.btn.paddingBottom`, this.obj.options.btn.paddingBottom);
        lodash.set(this.objTemplates, `${mode}.btn.paddingLeft`, this.obj.options.btn.paddingLeft);
    }

    onChangeSettings(type, cssProp, value) {
        switch (type) {
            case 'body':
                this.obj.options.body[cssProp] = value;
                break;
            case 'btn':
                if ((value === 'minus') || (value === 'plus')) {
                    value = this.onCalPlusMinus(cssProp, value);
                }

                if (cssProp === 'btnPaddingOption') {
                    if (this.obj.options[cssProp] === 'more') {
                        this.obj.options.btn['paddingTop'] = this.obj.options.btn['padding'];
                        this.obj.options.btn['paddingRight'] = this.obj.options.btn['padding'];
                        this.obj.options.btn['paddingBottom'] = this.obj.options.btn['padding'];
                        this.obj.options.btn['paddingLeft'] = this.obj.options.btn['padding'];
                    } else {
                        this.obj.options.btn['padding'] = this.obj.options.btn['paddingTop'];
                    }
                }

                if (cssProp === 'btnBorderOption') {
                    if (this.obj.options[cssProp] === 'more') {
                        this.obj.options.btn['borderTopWidth'] = this.obj.options.btn['borderWidth'];
                        this.obj.options.btn['borderRightWidth'] = this.obj.options.btn['borderWidth'];
                        this.obj.options.btn['borderBottomWidth'] = this.obj.options.btn['borderWidth'];
                        this.obj.options.btn['borderLeftWidth'] = this.obj.options.btn['borderWidth'];
                        this.obj.options.btn['borderTopStyle'] = this.obj.options.btn['borderStyle'];
                        this.obj.options.btn['borderRightStyle'] = this.obj.options.btn['borderStyle'];
                        this.obj.options.btn['borderBottomStyle'] = this.obj.options.btn['borderStyle'];
                        this.obj.options.btn['borderLeftStyle'] = this.obj.options.btn['borderStyle'];
                        this.obj.options.btn['borderTopColor'] = this.obj.options.btn['borderColor'];
                        this.obj.options.btn['borderRightColor'] = this.obj.options.btn['borderColor'];
                        this.obj.options.btn['borderBottomColor'] = this.obj.options.btn['borderColor'];
                        this.obj.options.btn['borderLeftColor'] = this.obj.options.btn['borderColor'];
                    } else {
                        this.obj.options.btn['borderWidth'] = this.obj.options.btn['borderTopWidth'];
                        this.obj.options.btn['borderStyle'] = this.obj.options.btn['borderTopStyle'];
                        this.obj.options.btn['borderColor'] = this.obj.options.btn['borderTopColor'];
                    }
                }

                if (cssProp === 'textAlign' && value === 'center') {
                    this.obj.options.btn['xDirection'] = '0%';
                }

                if (value) {
                    this.obj.options.btn[cssProp] = value;
                }
                break;
            default:
                if ((value === 'minus') || (value === 'plus')) {
                    if (value === 'minus') {
                        value = parseInt(this.obj.options[cssProp].slice(0, -1)) - 1;
                    }

                    if (value === 'plus') {
                        value = parseInt(this.obj.options[cssProp].slice(0, -1)) + 1;
                    }

                    if (value) {
                        this.obj.options[cssProp] = `${value}%`;
                    }
                }
                break;
        }

        if (this.staticImgPreviewMode === 'Laptop') {
            this.resetObjTemplates('laptop');
        } else {
            this.resetObjTemplates('mobile');
        }
    }

    onResetTemplate(settings) {
        switch (this.obj.staticBannerType) {
            case 'fixed':
                setTimeout(() => {
                    let iframe = document.querySelector('iframe#template-choosed');
                    if (iframe) {
                        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

                        if (iframe.document) {
                            const document = iframe.document;

                            if (document.querySelector('html')) {
                                const body = document.querySelector('body');
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');

                                const allElements = document.querySelectorAll('*');

                                for (let i = 0; i < allElements.length; i++) {
                                    const element = allElements[i];
                                    element.style.fontFamily = settings.body.fontFamily;
                                }

                                if (body) {
                                    body.style.backgroundColor = settings.body.backgroundColor;
                                }

                                if (imgOverlay) {
                                    imgOverlay.style.backgroundColor = settings.btn.backgroundColor;
                                }

                                if (button) {
                                    button.style.backgroundColor = settings.btn.backgroundColor;
                                    button.style.color = settings.btn.color;
                                }

                                if (this.staticImgPreviewMode === 'Laptop') {
                                    document.querySelector('.img-responsive-desktop').src = settings.bgImage;
                                    document.querySelector('.img-responsive-desktop').style.width = settings.sizeImage;
                                } else {
                                    document.querySelector('.img-responsive-mobile').src = settings.bgImage;
                                }
                            }
                        }
                    }
                }, 200);
                break;
            case 'normal':
                setTimeout(() => {
                    let iframe = document.querySelector('iframe#template-choosed');
                    if (iframe) {
                        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

                        if (iframe.document) {
                            const document = iframe.document;

                            if (document.querySelector('html')) {
                                const body = document.querySelector('body');
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');
                                const sheetToBeRemoved = document.getElementById('styleSheetId');

                                if (imgOverlay) {
                                    imgOverlay.style.left = settings.btn.xDirection;
                                    imgOverlay.style.textAlign = settings.btn.textAlign;
                                }

                                if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                                    const sheetParent = sheetToBeRemoved.parentNode;
                                    sheetParent.removeChild(sheetToBeRemoved);
                                    const style = document.createElement('style');
                                    style.id = 'styleSheetId';
                                    style.innerHTML = `.img-overlay::before{ height: ${settings.btn.yDirection} }`;
                                    document.querySelector('head').appendChild(style);
                                } else {
                                    const style = document.createElement('style');
                                    style.id = 'styleSheetId';
                                    style.innerHTML = `.img-overlay::before{ height: ${settings.btn.yDirection} }`;
                                    document.querySelector('head').appendChild(style);
                                }

                                const allElements = document.querySelectorAll('*');

                                for (let i = 0; i < allElements.length; i++) {
                                    const element = allElements[i];
                                    element.style.fontFamily = settings.body.fontFamily;
                                }

                                if (body) {
                                    body.style.backgroundColor = settings.body.backgroundColor;
                                }

                                if (button) {
                                    button.style.background = settings.btn.backgroundColor;
                                    button.style.color = settings.btn.color;
                                }

                                if (this.staticImgPreviewMode === 'Laptop') {
                                    document.querySelector('.img-responsive-desktop').src = settings.bgImage;
                                    document.querySelector('.img-responsive-desktop').style.width = settings.sizeImage;
                                } else {
                                    document.querySelector('.img-responsive-mobile').src = settings.bgImage;
                                }
                            }
                        }
                    }
                }, 200);
                break;
            default:
                setTimeout(() => {
                    let iframe = document.querySelector('iframe#template-choosed');
                    if (iframe) {
                        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

                        if (iframe.document) {
                            const document = iframe.document;

                            if (document.querySelector('html')) {
                                const body = document.querySelector('body');
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');
                                const sheetToBeRemoved = document.getElementById('styleSheetId');

                                if (imgOverlay) {
                                    imgOverlay.style.left = settings.btn.xDirection;
                                    imgOverlay.style.textAlign = settings.btn.textAlign;
                                }

                                if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                                    const sheetParent = sheetToBeRemoved.parentNode;
                                    sheetParent.removeChild(sheetToBeRemoved);
                                    const style = document.createElement('style');
                                    style.id = 'styleSheetId';
                                    style.innerHTML = `.img-overlay::before{ height: ${settings.btn.yDirection} }`;
                                    document.querySelector('head').appendChild(style);
                                } else {
                                    const style = document.createElement('style');
                                    style.id = 'styleSheetId';
                                    style.innerHTML = `.img-overlay::before{ height: ${settings.btn.yDirection} }`;
                                    document.querySelector('head').appendChild(style);
                                }

                                const allElements = document.querySelectorAll('*');

                                for (let i = 0; i < allElements.length; i++) {
                                    const element = allElements[i];
                                    element.style.fontFamily = settings.body.fontFamily;
                                }

                                if (body) {
                                    body.style.backgroundColor = settings.body.backgroundColor;
                                }

                                if (button) {
                                    button.style.backgroundColor = settings.btn.backgroundColor;
                                    button.style.fontWeight = settings.btn.fontWeight;
                                    button.style.color = settings.btn.color;
                                    button.style.borderRadius = settings.btn.borderRadius;

                                    if (settings.btnBorderOption === 'allsides') {
                                        button.style.borderColor = settings.btn.borderColor;
                                        button.style.borderStyle = settings.btn.borderStyle;
                                        button.style.borderWidth = settings.btn.borderWidth;
                                    } else {
                                        button.style.borderTopColor = settings.btn.borderTopColor;
                                        button.style.borderTopStyle = settings.btn.borderTopStyle;
                                        button.style.borderTopWidth = settings.btn.borderTopWidth;
                                        button.style.borderRightColor = settings.btn.borderRightColor;
                                        button.style.borderRightStyle = settings.btn.borderRightStyle;
                                        button.style.borderRightWidth = settings.btn.borderRightWidth;
                                        button.style.borderBottomColor = settings.btn.borderBottomColor;
                                        button.style.borderBottomStyle = settings.btn.borderBottomStyle;
                                        button.style.borderBottomWidth = settings.btn.borderBottomWidth;
                                        button.style.borderLeftColor = settings.btn.borderLeftColor;
                                        button.style.borderLeftStyle = settings.btn.borderLeftStyle;
                                        button.style.borderLeftWidth = settings.btn.borderLeftWidth;
                                    }

                                    if (settings.btnPaddingOption === 'allsides') {
                                        button.style.padding = settings.btn.padding;
                                    } else {
                                        button.style.paddingTop = settings.btn.paddingTop;
                                        button.style.paddingRight = settings.btn.paddingRight;
                                        button.style.paddingBottom = settings.btn.paddingBottom;
                                        button.style.paddingLeft = settings.btn.paddingLeft;
                                    }

                                    button.innerHTML = settings.btn.text;
                                }

                                if (this.staticImgPreviewMode === 'Laptop') {
                                    document.querySelector('.img-responsive-desktop').src = settings.bgImage;
                                    document.querySelector('.img-responsive-desktop').style.width = settings.sizeImage;
                                } else {
                                    document.querySelector('.img-responsive-mobile').src = settings.bgImage;
                                }
                            }
                        }
                    }
                }, 200);
                break;
        }
    }

    generateHTML() {
        this.saveDesign = true;
        this.generatedHTML = '';
        document.querySelector('#overlayBg').style.display = 'block';
        const generate = lodash.cloneDeep(this.obj);
        const settings = lodash.cloneDeep(this.objTemplates);
        let iframe = document.createElement('iframe');
        iframe.id = 'template-generate';
        iframe.width = '0';
        iframe.height = '0';
        iframe.style.border = 'none';

        const container = document.getElementById('generateHTML');
        if (container.childNodes[0]) {
            container.removeChild(container.childNodes[0]);
        }
        container.appendChild(iframe);
        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        iframe.document.open();
        iframe.document.write('');
        iframe.document.write(generate.htmlCode);
        iframe.document.close();

        switch (generate.staticBannerType) {
            case 'fixed':
                setTimeout(() => {
                    let getiframe = document.querySelector('iframe#template-generate');
                    if (getiframe) {
                        getiframe = getiframe.contentWindow || getiframe.contentDocument.document || getiframe.contentDocument;

                        if (getiframe.document) {
                            const document = getiframe.document;
                            if (document.querySelector('html')) {
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');
                                let buttonClassList = null;
                                const sheetToBeRemoved = document.getElementById('styleId');

                                if (button.classList.length) {
                                    buttonClassList = button.classList[0];
                                }

                                if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                                    const sheetParent = sheetToBeRemoved.parentNode;
                                    sheetParent.removeChild(sheetToBeRemoved);
                                } else {
                                    const style = document.createElement('style');
                                    style.id = 'styleId';
                                    style.innerHTML = `
                                            * {
                                                font-family: ${settings.body.fontFamily};
                                            }
            
                                            body {
                                                background-color: ${settings.body.backgroundColor};
                                            }

                                            .img-overlay {
                                                background: ${settings.laptop.btn.backgroundColor};
                                            }
            
                                            .img-responsive-desktop {
                                                width: ${settings.laptop.sizeImage};
                                            }
            
                                            ${buttonClassList ? `.${buttonClassList} {
                                                color: ${settings.laptop.btn.color};
                                                background-color: ${settings.laptop.btn.backgroundColor};
                                            }` : ''}

                                            ${buttonClassList ? `.${buttonClassList}:disabled {
                                                background-color: #B3B3B3;
                                            }` : ''}
            
                                            @media screen and (max-width: 768px) {
                                                .img-overlay {
                                                    background: ${settings.mobile.btn.backgroundColor};
                                                }

                                                ${buttonClassList ? `.${buttonClassList} {
                                                    color: ${settings.mobile.btn.color};
                                                    background-color: ${settings.mobile.btn.backgroundColor};
                                                }` : ''}
                                            }
                                        `;
                                    document.querySelector('head').appendChild(style);
                                }

                                document.querySelector('.img-responsive-desktop').src = settings.laptop.bgImage;
                                document.querySelector('.img-responsive-mobile').src = settings.mobile.bgImage;

                                this.generatedHTML = `
                                    <!DOCTYPE html>
                                        <html lang="en">
                                            ${document.querySelector('html').innerHTML}
                                        </html>
                                    `;
                            }
                        }
                    }
                    document.querySelector('#overlayBg').style.display = 'none';
                }, 5000);
                break;
            case 'normal':
                setTimeout(() => {
                    let getiframe = document.querySelector('iframe#template-generate');
                    if (getiframe) {
                        getiframe = getiframe.contentWindow || getiframe.contentDocument.document || getiframe.contentDocument;

                        if (getiframe.document) {
                            const document = getiframe.document;
                            if (document.querySelector('html')) {
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');
                                let buttonClassList = null;
                                const sheetToBeRemoved = document.getElementById('styleId');

                                if (button.classList.length) {
                                    buttonClassList = button.classList[0];
                                }

                                if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                                    const sheetParent = sheetToBeRemoved.parentNode;
                                    sheetParent.removeChild(sheetToBeRemoved);
                                } else {
                                    const style = document.createElement('style');
                                    style.id = 'styleId';
                                    style.innerHTML = `
                                                * {
                                                    font-family: ${settings.body.fontFamily};
                                                }
                
                                                body {
                                                    background-color: ${settings.body.backgroundColor};
                                                }
                
                                                .img-responsive-desktop {
                                                    width: ${settings.laptop.sizeImage};
                                                }

                                                .img-overlay {
                                                    left: ${settings.laptop.btn.xDirection};
                                                    text-align: ${settings.laptop.btn.textAlign};
                                                }
                
                                                .img-overlay:before {
                                                    height: ${settings.laptop.btn.yDirection};
                                                }
                
                                                ${buttonClassList ? `.${buttonClassList} {
                                                    color: ${settings.laptop.btn.color};
                                                    background: ${settings.laptop.btn.backgroundColor};
                                                }` : ''}

                                                ${buttonClassList ? `.${buttonClassList}:disabled {
                                                    background-color: #B3B3B3;
                                                }` : ''}
                
                                                @media screen and (max-width: 768px) {
                                                    .img-overlay {
                                                        left: ${settings.mobile.btn.xDirection};
                                                        text-align: ${settings.mobile.btn.textAlign};
                                                    }
                
                                                    .img-overlay:before {
                                                        height: ${settings.mobile.btn.yDirection};
                                                    }

                                                    ${buttonClassList ? `.${buttonClassList} {
                                                        color: ${settings.mobile.btn.color};
                                                        background: ${settings.mobile.btn.backgroundColor};
                                                    }` : ''}
                                                }
                                            `;
                                    document.querySelector('head').appendChild(style);
                                }

                                document.querySelector('.img-responsive-desktop').src = settings.laptop.bgImage;
                                document.querySelector('.img-responsive-mobile').src = settings.mobile.bgImage;

                                this.generatedHTML = `
                                        <!DOCTYPE html>
                                            <html lang="en">
                                                ${document.querySelector('html').innerHTML}
                                            </html>
                                        `;
                            }
                        }
                    }
                    document.querySelector('#overlayBg').style.display = 'none';
                }, 5000);
                break;
            default:
                setTimeout(() => {
                    let getiframe = document.querySelector('iframe#template-generate');
                    if (getiframe) {
                        getiframe = getiframe.contentWindow || getiframe.contentDocument.document || getiframe.contentDocument;

                        if (getiframe.document) {
                            const document = getiframe.document;
                            if (document.querySelector('html')) {
                                const imgOverlay = document.querySelector('.img-overlay');
                                const button = imgOverlay.querySelector('button:first-child');
                                let buttonClassList = null;
                                const sheetToBeRemoved = document.getElementById('styleId');

                                if (button.classList.length) {
                                    buttonClassList = button.classList[0];
                                }

                                if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                                    const sheetParent = sheetToBeRemoved.parentNode;
                                    sheetParent.removeChild(sheetToBeRemoved);
                                } else {
                                    const style = document.createElement('style');
                                    style.id = 'styleId';
                                    style.innerHTML = `
                                            * {
                                                font-family: ${settings.body.fontFamily};
                                            }
            
                                            body {
                                                background-color: ${settings.body.backgroundColor};
                                            }
            
                                            .img-responsive-desktop {
                                                width: ${settings.laptop.sizeImage};
                                            }
            
                                            .img-overlay {
                                                left: ${settings.laptop.btn.xDirection};
                                                text-align: ${settings.laptop.btn.textAlign};
                                            }
            
                                            .img-overlay:before {
                                                height: ${settings.laptop.btn.yDirection};
                                            }
            
                                            ${buttonClassList ? `.${buttonClassList} {
                                                color: ${settings.laptop.btn.color};
                                                background-color: ${settings.laptop.btn.backgroundColor};
                                                ${
                                            (settings.laptop.btnBorderOption === 'allsides') ? `
                                                        border-style: ${settings.laptop.btn.borderStyle} !important;
                                                        border-width: ${settings.laptop.btn.borderWidth} !important;
                                                        border-color: ${settings.laptop.btn.borderColor} !important;
                                                    ` : `
                                                        border-style: ${settings.laptop.btn.borderStyle};
                                                        border-width: ${settings.laptop.btn.borderWidth};
                                                        border-color: ${settings.laptop.btn.borderColor};
                                                    `
                                            }
                                                border-top-style: ${settings.laptop.btn.borderTopStyle};
                                                border-top-width: ${settings.laptop.btn.borderTopWidth};
                                                border-top-color: ${settings.laptop.btn.borderTopColor};
                                                border-right-style: ${settings.laptop.btn.borderRightStyle};
                                                border-right-width: ${settings.laptop.btn.borderRightWidth};
                                                border-right-color: ${settings.laptop.btn.borderRightColor};
                                                border-bottom-style: ${settings.laptop.btn.borderBottomStyle};
                                                border-bottom-width: ${settings.laptop.btn.borderBottomWidth};
                                                border-bottom-color: ${settings.laptop.btn.borderBottomColor};
                                                border-left-style: ${settings.laptop.btn.borderLeftStyle};
                                                border-left-width: ${settings.laptop.btn.borderLeftWidth};
                                                border-left-color: ${settings.laptop.btn.borderLeftColor};
                                                border-radius: ${settings.laptop.btn.borderRadius};
                                                font-weight: ${settings.laptop.btn.fontWeight};
                                                ${
                                            (settings.laptop.btnPaddingOption === 'allsides') ? `
                                                    padding: ${settings.laptop.btn.padding} !important;
                                                ` : `
                                                    padding: ${settings.laptop.btn.padding};
                                                `
                                            }
                                                padding-bottom: ${settings.laptop.btn.paddingTop};
                                                padding-left: ${settings.laptop.btn.paddingLeft};
                                                padding-right: ${settings.laptop.btn.paddingRight};
                                                padding-top: ${settings.laptop.btn.paddingTop};
                                                
                                            }` : ''}

                                            ${buttonClassList ? `.${buttonClassList}:disabled {
                                                background-color: #B3B3B3;
                                            }` : ''}
            
                                            @media screen and (max-width: 768px) {
                                                .img-overlay {
                                                    left: ${settings.mobile.btn.xDirection};
                                                    text-align: ${settings.mobile.btn.textAlign};
                                                }
            
                                                .img-overlay:before {
                                                    height: ${settings.mobile.btn.yDirection};
                                                }
            
                                                ${buttonClassList ? `.${buttonClassList} {
                                                    color: ${settings.mobile.btn.color};
                                                    background-color: ${settings.mobile.btn.backgroundColor};
                                                    ${
                                            (settings.mobile.btnBorderOption === 'allsides') ? `
                                                            border-style: ${settings.mobile.btn.borderStyle} !important;
                                                            border-width: ${settings.mobile.btn.borderWidth} !important;
                                                            border-color: ${settings.mobile.btn.borderColor} !important;
                                                            border-top-style: ${settings.mobile.btn.borderTopStyle};
                                                            border-top-width: ${settings.mobile.btn.borderTopWidth};
                                                            border-top-color: ${settings.mobile.btn.borderTopColor};
                                                            border-right-style: ${settings.mobile.btn.borderRightStyle};
                                                            border-right-width: ${settings.mobile.btn.borderRightWidth};
                                                            border-right-color: ${settings.mobile.btn.borderRightColor};
                                                            border-bottom-style: ${settings.mobile.btn.borderBottomStyle};
                                                            border-bottom-width: ${settings.mobile.btn.borderBottomWidth};
                                                            border-bottom-color: ${settings.mobile.btn.borderBottomColor};
                                                            border-left-style: ${settings.mobile.btn.borderLeftStyle};
                                                            border-left-width: ${settings.mobile.btn.borderLeftWidth};
                                                            border-left-color: ${settings.mobile.btn.borderLeftColor};
                                                            ` : `
                                                            border-style: ${settings.mobile.btn.borderStyle};
                                                            border-width: ${settings.mobile.btn.borderWidth};
                                                            border-color: ${settings.mobile.btn.borderColor};
                                                            border-top-style: ${settings.mobile.btn.borderTopStyle} !important;
                                                            border-top-width: ${settings.mobile.btn.borderTopWidth} !important;
                                                            border-top-color: ${settings.mobile.btn.borderTopColor} !important;
                                                            border-right-style: ${settings.mobile.btn.borderRightStyle} !important;
                                                            border-right-width: ${settings.mobile.btn.borderRightWidth} !important;
                                                            border-right-color: ${settings.mobile.btn.borderRightColor} !important;
                                                            border-bottom-style: ${settings.mobile.btn.borderBottomStyle} !important;
                                                            border-bottom-width: ${settings.mobile.btn.borderBottomWidth} !important;
                                                            border-bottom-color: ${settings.mobile.btn.borderBottomColor} !important;
                                                            border-left-style: ${settings.mobile.btn.borderLeftStyle} !important;
                                                            border-left-width: ${settings.mobile.btn.borderLeftWidth} !important;
                                                            border-left-color: ${settings.mobile.btn.borderLeftColor} !important;
                                                            `
                                            }
                                                    border-radius: ${settings.mobile.btn.borderRadius};
                                                    font-weight: bolder;
                                                    ${
                                            (settings.mobile.btnPaddingOption === 'allsides') ? `
                                                            padding: ${settings.mobile.btn.padding} !important;
                                                            padding-top: ${settings.mobile.btn.paddingTop};
                                                            padding-right: ${settings.mobile.btn.paddingRight};
                                                            padding-bottom: ${settings.mobile.btn.paddingTop};
                                                            padding-left: ${settings.mobile.btn.paddingLeft};
                                                        `: `
                                                            padding: ${settings.mobile.btn.padding};
                                                            padding-top: ${settings.mobile.btn.paddingTop} !important;
                                                            padding-right: ${settings.mobile.btn.paddingRight} !important;
                                                            padding-bottom: ${settings.mobile.btn.paddingTop} !important;
                                                            padding-left: ${settings.mobile.btn.paddingLeft} !important;
                                                        `
                                            }
                                                }` : ''}
                                            }
                                        `;
                                    document.querySelector('head').appendChild(style);
                                }

                                if (button) {
                                    button.innerHTML = settings.btn.text;
                                }

                                document.querySelector('.img-responsive-desktop').src = settings.laptop.bgImage;
                                document.querySelector('.img-responsive-mobile').src = settings.mobile.bgImage;

                                this.generatedHTML = `
                                    <!DOCTYPE html>
                                        <html lang="en">
                                            ${document.querySelector('html').innerHTML}
                                        </html>
                                    `;
                            }
                        }
                    }

                    document.querySelector('#overlayBg').style.display = 'none';
                }, 5000);
                break;
        }
    }
}
export default angular
    .module('app.banner.controller', ['agGrid', 'colorpicker', 'ngJoyRide'])
    .controller('BannerCtrl', BannerCtrl);
