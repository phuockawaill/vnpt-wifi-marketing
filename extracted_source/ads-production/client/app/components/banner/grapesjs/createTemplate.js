const initGui = (windowHeight, data, type)=>{
    return {
        container : '#gjs',
        height: windowHeight+'px',
        components: data?data.htmlCode:proto[type].htmlCode,//this.obj.htmlCode?this.obj.htmlCode:proto[this.obj.type].htmlCode
        style: data?data.css:proto[type].css,//this.obj.css?this.obj.css:proto[this.obj.type].css
        js: data?data.js:proto[type].js,
        // defaultCommand: 'preview',
        deviceManager: {
            devices: [
                 {name: 'Laptop', width: '1625px', height: '935px'},
                 {name: 'Mobile', width: '800px', height: '1250px'}
            ],
        },
        showDevices: 0,
        plugins: [
            'gjs-plugin-export', 'gjs-aviary', 'gjs-blocks-basic', 'gjs-blocks-flexbox',
            'gjs-navbar', 'gjs-component-countdown', 'gjs-plugin-forms'
        ],
        pluginsOpts: {
            'gjs-blocks-basic': {
                blocks: ['column1', 'column2', 'column3', 'column3-7', 'flexbox', 'text', 'link', 'image', 'map']
            }
        },
        assetManager: {
            assets: [],
            upload: 0,
            uploadText: 'Uploading is not available'
        },
        styleManager : {
            sectors: [{
              name: 'General',
              buildProps: ['float', 'display', 'position', 'top', 'right', 'left', 'bottom'],
              properties:[{
                  name: 'Alignment',
                  property: 'float',
                  type: 'radio',
                  defaults: 'none',
                  list: [
                    { value: 'none', className: 'fa fa-times'},
                    { value: 'left', className: 'fa fa-align-left'},
                    { value: 'right', className: 'fa fa-align-right'}
                  ],
                },
                { property: 'position', type: 'select'}
              ],
            },{
                name: 'Dimension',
                open: false,
                buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
                properties:[{
                  property: 'margin',
                  properties:[
                    { name: 'Top', property: 'margin-top'},
                    { name: 'Right', property: 'margin-right'},
                    { name: 'Bottom', property: 'margin-bottom'},
                    { name: 'Left', property: 'margin-left'}
                  ],
                },{
                  property  : 'padding',
                  properties:[
                    { name: 'Top', property: 'padding-top'},
                    { name: 'Right', property: 'padding-right'},
                    { name: 'Bottom', property: 'padding-bottom'},
                    { name: 'Left', property: 'padding-left'}
                  ],
                }],
              },{
                name: 'Typography',
                open: false,
                buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'],
                properties:[
                  { name: 'Font', property: 'font-family'},
                  { name: 'Weight', property: 'font-weight'},
                  { name:  'Font color', property: 'color'},
                  {
                    property: 'text-align',
                    type: 'radio',
                    defaults: 'left',
                    list: [
                      { value : 'left',  name : 'Left',    className: 'fa fa-align-left'},
                      { value : 'center',  name : 'Center',  className: 'fa fa-align-center' },
                      { value : 'right',   name : 'Right',   className: 'fa fa-align-right'},
                      { value : 'justify', name : 'Justify',   className: 'fa fa-align-justify'}
                    ],
                  },{
                    property: 'text-decoration',
                    type: 'radio',
                    defaults: 'none',
                    list: [
                      { value: 'none', name: 'None', className: 'fa fa-times'},
                      { value: 'underline', name: 'underline', className: 'fa fa-underline' },
                      { value: 'line-through', name: 'Line-through', className: 'fa fa-strikethrough'}
                    ],
                  },{
                    property: 'text-shadow',
                    properties: [
                      { name: 'X position', property: 'text-shadow-h'},
                      { name: 'Y position', property: 'text-shadow-v'},
                      { name: 'Blur', property: 'text-shadow-blur'},
                      { name: 'Color', property: 'text-shadow-color'}
                    ],
                }],
              },{
                name: 'Decorations',
                open: false,
                buildProps: ['opacity', 'background-color', 'border-radius', 'border', 'box-shadow', 'background'],
                properties: [{
                  type: 'slider',
                  property: 'opacity',
                  defaults: 1,
                  step: 0.01,
                  max: 1,
                  min:0,
                },{
                  property: 'border-radius',
                  properties  : [
                    { name: 'Top', property: 'border-top-left-radius'},
                    { name: 'Right', property: 'border-top-right-radius'},
                    { name: 'Bottom', property: 'border-bottom-left-radius'},
                    { name: 'Left', property: 'border-bottom-right-radius'}
                  ],
                },{
                  property: 'box-shadow',
                  properties: [
                    { name: 'X position', property: 'box-shadow-h'},
                    { name: 'Y position', property: 'box-shadow-v'},
                    { name: 'Blur', property: 'box-shadow-blur'},
                    { name: 'Spread', property: 'box-shadow-spread'},
                    { name: 'Color', property: 'box-shadow-color'},
                    { name: 'Shadow type', property: 'box-shadow-type'}
                  ],
                },{
                  property: 'background',
                  properties: [
                    { name: 'Image', property: 'background-image'},
                    { name: 'Repeat', property:   'background-repeat'},
                    { name: 'Position', property: 'background-position'},
                    { name: 'Attachment', property: 'background-attachment'},
                    { name: 'Size', property: 'background-size'}
                  ],
                },],
              },{
                name: 'Flex',
                open: false,
                properties: [{
                  name: 'Flex Container',
                  property: 'display',
                  type: 'select',
                  defaults: 'block',
                  list: [
                    { value: 'block', name: 'Disable'},
                    { value: 'flex', name: 'Enable'}
                  ],
                },{
                  name: 'Flex Parent',
                  property: 'label-parent-flex',
                  type: 'integer',
                },{
                  name      : 'Direction',
                  property  : 'flex-direction',
                  type    : 'radio',
                  defaults  : 'row',
                  list    : [{
                            value   : 'row',
                            name    : 'Row',
                            className : 'icons-flex icon-dir-row',
                            title   : 'Row',
                          },{
                            value   : 'row-reverse',
                            name    : 'Row reverse',
                            className : 'icons-flex icon-dir-row-rev',
                            title   : 'Row reverse',
                          },{
                            value   : 'column',
                            name    : 'Column',
                            title   : 'Column',
                            className : 'icons-flex icon-dir-col',
                          },{
                            value   : 'column-reverse',
                            name    : 'Column reverse',
                            title   : 'Column reverse',
                            className : 'icons-flex icon-dir-col-rev',
                          }],
                },{
                  name      : 'Justify',
                  property  : 'justify-content',
                  type    : 'radio',
                  defaults  : 'flex-start',
                  list    : [{
                            value   : 'flex-start',
                            className : 'icons-flex icon-just-start',
                            title   : 'Start',
                          },{
                            value   : 'flex-end',
                            title    : 'End',
                            className : 'icons-flex icon-just-end',
                          },{
                            value   : 'space-between',
                            title    : 'Space between',
                            className : 'icons-flex icon-just-sp-bet',
                          },{
                            value   : 'space-around',
                            title    : 'Space around',
                            className : 'icons-flex icon-just-sp-ar',
                          },{
                            value   : 'center',
                            title    : 'Center',
                            className : 'icons-flex icon-just-sp-cent',
                          }],
                },{
                  name      : 'Align',
                  property  : 'align-items',
                  type    : 'radio',
                  defaults  : 'center',
                  list    : [{
                            value   : 'flex-start',
                            title    : 'Start',
                            className : 'icons-flex icon-al-start',
                          },{
                            value   : 'flex-end',
                            title    : 'End',
                            className : 'icons-flex icon-al-end',
                          },{
                            value   : 'stretch',
                            title    : 'Stretch',
                            className : 'icons-flex icon-al-str',
                          },{
                            value   : 'center',
                            title    : 'Center',
                            className : 'icons-flex icon-al-center',
                          }],
                },{
                  name: 'Flex Children',
                  property: 'label-parent-flex',
                  type: 'integer',
                },{
                  name:     'Order',
                  property:   'order',
                  type:     'integer',
                  defaults :  0,
                  min: 0
                },{
                  name    : 'Flex',
                  property  : 'flex',
                  type    : 'composite',
                  properties  : [{
                          name:     'Grow',
                          property:   'flex-grow',
                          type:     'integer',
                          defaults :  0,
                          min: 0
                        },{
                          name:     'Shrink',
                          property:   'flex-shrink',
                          type:     'integer',
                          defaults :  0,
                          min: 0
                        },{
                          name:     'Basis',
                          property:   'flex-basis',
                          type:     'integer',
                          units:    ['px','%',''],
                          unit: '',
                          defaults :  'auto',
                        }],
                },{
                  name      : 'Align',
                  property  : 'align-self',
                  type      : 'radio',
                  defaults  : 'auto',
                  list    : [{
                            value   : 'auto',
                            name    : 'Auto',
                          },{
                            value   : 'flex-start',
                            title    : 'Start',
                            className : 'icons-flex icon-al-start',
                          },{
                            value   : 'flex-end',
                            title    : 'End',
                            className : 'icons-flex icon-al-end',
                          },{
                            value   : 'stretch',
                            title    : 'Stretch',
                            className : 'icons-flex icon-al-str',
                          },{
                            value   : 'center',
                            title    : 'Center',
                            className : 'icons-flex icon-al-center',
                          }],
                }]
              }
            ],
        },

        storageManager: {
            type: 'remote',
            autosave: false,
        }
    }
};

const proto = {
    'standard': {
        name: 'Standard banner',
        htmlCode: '<img class="c1606" src="http://112.109.90.76:20080/resource/thuans2/bg_temp1.jpg"/><img class="c5681" src="http://112.109.90.76:20080/resource/thuans2/bg_mobile_temp1.jpg"/><div class="row"><div class="cell"><div class="c2591">RIVER<br/>          PANORAMA<br/></div><div class="c2641">KHU CĂN HỘ BIỆT LẬP VEN SÔNG QUẬN 7<br/></div><div class="c3430">MỞ BÁN GIAI ĐOẠN 2<br/></div><div class="c3534">CHỈ TỪ 1,7 TỶ ĐỒNG/CĂN (2PN)<br/></div><div class="c3638">Thanh toán linh hoạt 1%/tháng </div></div></div>'+
        '<form class="form"><div class="form-group"><input class="input" placeholder="Enter your email" required="true"/></div><div class="form-group"><input class="input" placeholder="Enter your phone" type="email"/></div><div class="form-group"><button class="button" type="submit">TRUY CẬP INTERNET</button></div></form>',
        css: '*{box-sizing: border-box;}body{margin:0;}.row{display:table;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;width:40%;position:fixed;height:65%;right:1px;top:1px;background-color:rgba(255, 255, 255, 0);}.cell{width:8%;display:table-cell;height:75px;}'+
        '.cell{width:100%;display:table-cell;height:75px;background-color:rgba(19, 31, 43,0.5);}.form{background-repeat:repeat;background-position-x:left;background-position-y:top;background-attachment:scroll;background-size:cover;height:35%;padding-top:5%;padding-right:0px;padding-bottom:0px;padding-left:0px;margin-top:0px;margin-right:0px;margin-bottom:0px;margin-left:0px;background-image:url(\"http://112.109.90.76:20080/resource/thuans2/footer_temp1.png\");}'+
        '.c1606{color:black;height:65%;width:100%;}.form-group{display:block;width:100%;float:none;text-align:center;}.input{border-top-left-radius:20px;border-top-right-radius:20px;border-bottom-right-radius:20px;border-bottom-left-radius:20px;font-size:1.5rem;padding-top:0%;padding-right:0px;padding-bottom:0px;padding-left:10px;margin-top:0px;margin-right:0px;margin-bottom:10px;margin-left:0px;width:50%;margin:0px 0px 10px 0px;}'+
        '.button{background-color:rgb(151, 153, 154);color:rgb(255, 255, 255);border-top-left-radius:20px;border-top-right-radius:20px;border-bottom-right-radius:20px;border-bottom-left-radius:20px;padding-top:10px;padding-right:20px;padding-bottom:10px;padding-left:20px;font-size:1.5rem;}'+
        '.c2591{padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;color:rgb(255, 255, 255);font-family:Arial, Helvetica, sans-serif;text-align:center;top:0%;margin-top:15%;margin-right:0px;margin-bottom:0px;margin-left:0px;font-size:23px;}'+
        '.c2641{padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;font-family:Arial, Helvetica, sans-serif;color:rgb(255, 255, 255);font-size:15px;font-weight:700;text-align:center;}'+
        '.c3430{padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;color:rgb(255, 255, 255);text-align:center;font-weight:600;font-family:Arial, Helvetica, sans-serif;margin-top:15%;margin-right:0px;margin-bottom:0px;margin-left:0px;}'+
        '.c3534{padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;color:rgb(255, 255, 255);text-align:center;font-size:29px;font-family:Arial, Helvetica, sans-serif;font-weight:800;}'+
        '.c3638{padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;color:rgb(255, 255, 255);text-align:center;font-family:Arial, Helvetica, sans-serif;font-weight:600;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:currentcolor;}.c5681{color:black;display:none;}'+
        '@media (max-width: 800px){.cell{width:100%;display:block;background-color:rgba(0,0,0,0);}.c1606{display:none;}.c5681{display:block;width:100%;height:65%;}.c2591{margin:10px 0px 0px 0px;}.c3534{font-size:1.5rem;}.row{position:fixed;width:100%;height: auto;}.c3430{margin:20px 0px 0px 0px;}.input{width:90%;}}',
        js: ''
    },
    'flash': {
        name: 'Flash banner',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'slide': {
        name: 'Slide banner',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'survey': {
        name: 'Survey',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'video': {
        name: 'Video clip',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'facebookLogin': {
        name: 'Facebook login',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'facebookShare': {
        name: 'Facebook Share',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'facebookCheckin': {
        name: 'Facebook checkin',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
    'custom': {
        name: 'Tùy Chỉnh',
        htmlCode: '<div class="wrapper"><div class="desktop"></div><div class="mobile"></div></div>',
        css: '.wrapper{height:100vh}.desktop{display: inline-block;height: 100vh; width: 100%}.mobile{display: none}@media (max-width: 800px){.desktop{display: none}.mobile{display: inline-block;height: 100vh; width: 100%}}',
        js: ''
    },
}

const initCmd = function (editor) {
    /****************** COMMANDS *************************/
    let cmdm = editor.Commands;
    cmdm.add('undo', {
        run: function(editor, sender) {
          sender.set('active', 0);
          editor.UndoManager.undo(1);
    }
    });
    cmdm.add('redo', {
        run: function(editor, sender) {
          sender.set('active', 0);
          editor.UndoManager.redo(1);
        }
    });
    cmdm.add('set-device-laptop', {
        run: function(editor) {
          editor.setDevice('Laptop');
        }
    });
    cmdm.add('set-device-mobile', {
        run: function(editor) {
          editor.setDevice('Mobile');
        }
    });
    cmdm.add('zoom-view', require('./zoomPanel'));
    cmdm.add('js-view', require('./jsPanel'));

    /****************** BUTTONS *************************/
    let pnm = editor.Panels;
    // Add and beautify tooltips
    pnm.addButton('options', [{
        id: 'undo',
        className: 'fa fa-undo',
        command: 'undo',
        attributes: { title: 'Undo (CTRL/CMD + Z)'}
    },{
        id: 'redo',
        className: 'fa fa-repeat',
        command: 'redo',
        attributes: { title: 'Redo (CTRL/CMD + SHIFT + Z)' }
    }]);
    // Add devices buttons
    let panelDevices = pnm.addPanel({id: "devices-c"});
    let deviceBtns = panelDevices.get('buttons');
    deviceBtns.add([{
        id: 'Laptop',
        command: 'set-device-laptop',
        className: 'fa fa-laptop',
        attributes: {'title': 'Laptop'},
        active: 1,
    },{
        id: 'Mobile',
        command: 'set-device-mobile',
        className: 'fa fa-mobile',
        attributes: {'title': 'Mobile'},
    }]);
    updateTooltip(deviceBtns);
    updateTooltip(pnm.getPanel('options').get('buttons'));
    updateTooltip(pnm.getPanel('options').get('buttons'));
    updateTooltip(pnm.getPanel('views').get('buttons'));

    // Load and show settings and style manager
    var openTmBtn = pnm.getButton('views', 'open-tm');
    openTmBtn && openTmBtn.set('active', 1);
    var openSm = pnm.getButton('views', 'open-sm');
    openSm && openSm.set('active', 1);

    // Add Settings Sector
    let traitsSector = $('<div class="gjs-sm-sector no-select">'+
      '<div class="gjs-sm-title"><span class="fa fa-cog"></span>' +
      ' Settings</div>' +
      '<div class="gjs-sm-properties" style="display: none;"></div></div>');
    let traitsProps = traitsSector.find('.gjs-sm-properties');
    traitsProps.append($('.gjs-trt-traits'));
    $('#gjs-sm-sectors').before(traitsSector);
    traitsSector.find('.gjs-sm-title').on('click', function(){
      let traitStyle = traitsProps.get(0).style;
      let hidden = traitStyle.display == 'none';
      if (hidden) {
        traitStyle.display = 'block';
      } else {
        traitStyle.display = 'none';
      }
    });

    let openBlocksBtn = editor.Panels.getButton('views', 'open-blocks');
    openBlocksBtn && openBlocksBtn.set('active', 1);
    // Move Ad
    $('#gjs').append($('.ad-cont'));
    /****************** ZOOM command *************************/
    let viewsPanel = pnm.getPanel("views");
    let viewsBtns = viewsPanel.get('buttons');
    viewsBtns.add([{
        id: 'zoomView',
        command: 'zoom-view',
        className: 'fa fa-search',
        attributes: {'title': 'Zoom'}
    }]);

    /****************** JS command *************************/
    viewsBtns.add([{
        id: 'jsCode',
        command: 'js-view',
        className: 'fa fa-code',
        attributes: {'title': 'JS code'}
    }]);
}

function updateTooltip(coll, pos) {
  coll.each(function(item) {
    var attrs = item.get('attributes');
    attrs['data-tooltip-pos'] = pos || 'bottom';
    item.set('attributes', attrs);
  });
}
export {initGui, proto, initCmd};
