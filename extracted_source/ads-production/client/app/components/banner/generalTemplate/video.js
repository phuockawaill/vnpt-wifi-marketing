const lodash = require('lodash');
import moment from 'moment';

const initVideo = (that) => {
    that.vidEditOptions = {};
    that.vidSaveFileTmp = {};
    that.vidGeneratedHTML = '';
    that.vidSaveDesign = false;
    that.vidSidebarRight = true;
    that.videoPreviewMode = 'Laptop';
    that.objVideo = {
        options: {
            body: {
                backgroundColor: '#ffffff',
                fontFamily: 'Montserrat, sans-serif',
            },
            img: {
                imgOption: 'header',
                enableHeaderImg: 'on',
                enableFooterImg: 'on',
                enablePosterImg: 'on',
                headerImg: '',
                footerImg: '',
                posterImg: ''
            },
            video: {
                videoSrc: '',
                muted: true,
                autoPlay: false,
                displayTimeBtn: 5,
                displayTimeBtnCustom: 3
            },
            btn: {
                btnBorderOption: 'allsides',
                btnPaddingOption: 'allsides',
                text: 'Click here to access Internet',
                color: '#ffffff',
                fontWeight: 'normal',
                backgroundColor: '#3aaee0',
                textAlign: 'center',
                xDirection: '0%',
                yDirection: '5%',
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
                paddingLeft: '10px'
            }
        }
    };

    that.vidUseTemplate = (template, opts) => {
        that.objVideo = {};
        const clonedefaultTemplate = lodash.cloneDeep(that.templates.filter(item => item.type === 'video_default')[0]);
        that.objVideo.htmlCode = clonedefaultTemplate.htmlCode;

        if (!template) {
            that.objVideo['id'] = null;
            that.objVideo.options = clonedefaultTemplate.options;
        } else {
            const cloneOpts = lodash.cloneDeep(opts);
            that.objVideo['id'] = cloneOpts.id;
            that.objVideo.createdAt = cloneOpts.createdAt;
            that.objVideo.createdBy = cloneOpts.createdBy;
            that.objVideo.createdByUsername = cloneOpts.createdByUsername;
            that.objVideo.updatedBy = cloneOpts.updatedBy;
            that.objVideo.updatedByUsername = cloneOpts.updatedByUsername;

            if (cloneOpts && cloneOpts.options && cloneOpts.options.templateType && cloneOpts.options.templateType === 'video') {
                that.objVideo.options = cloneOpts.options;
                that.objVideo.options = lodash.omit(that.objVideo.options, 'templateType');
            } else {
                that.objVideo.options = clonedefaultTemplate.options;
            }
        }
        that.vidEditHandleMode('Laptop');
    }

    that.vidEditHandleMode = (mode) => {
        that.videoPreviewMode = mode;
        setTimeout(() => {
            let iframe = document.createElement('iframe');
            iframe.id = 'video-choosed';
            if (mode === 'Laptop') {
                iframe.width = '100%';
                iframe.height = '800px';
                iframe.style.border = 'none';
            } else {
                iframe.width = '100%';
                iframe.height = '602px';
                iframe.style.border = 'none';
            }
            that.onVideoChangeSettings();

            let container = document.getElementById('edit-handle-video');
            if (container.childNodes[0]) {
                container.removeChild(container.childNodes[0]);
            }
            container.appendChild(iframe);
            iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
            iframe.document.open();
            iframe.document.write("");
            setTimeout(() => {
                iframe.document.write(that.objVideo.htmlCode);
                iframe.document.close();
            }, 50);
        }, 200);
    };

    that.vidHandleUploadFileServer = (file, position) => {
        switch (position) {
            case 'header':
                that.objVideo.options.img.headerImg = file.preview;
                that.vidSaveFileTmp['header'] = file;
                break;
            case 'footer':
                that.objVideo.options.img.footerImg = file.preview;
                that.vidSaveFileTmp['footer'] = file;
                break;
            case 'poster':
                that.objVideo.options.img.posterImg = file.preview;
                that.vidSaveFileTmp['poster'] = file;
                break;
            default:
                that.objVideo.options.video.videoSrc = file.preview;
                that.vidSaveFileTmp['video'] = file;
                break;
        }

        that.onVideoChangeSettings();
    }

    that.onVideoOpenSidebar = (type) => {
        if (type === 'right') {
            that.vidSidebarRight = !that.vidSidebarRight;
            Dropzone.autoDiscover = false;
            const there = that;

            const dropzone = new Dropzone("#dropzoneImageVideo", {
                url: '/uploads',
                paramName: "file",
                maxFiles: 1,
                maxFilesize: 12,
                acceptedFiles: "image/*",
                dictDefaultMessage: that.$rootScope.isLang === 'VN' ? 'Kéo thả hình ảnh vào đây hoặc click để chọn hình ảnh cần upload' : 'Drop a new image here, or click to select files to upload.',
                accept: function (file, done) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        const image = new Image();
                        image.src = URL.createObjectURL(file);

                        image.onload = () => {
                            file.preview = URL.createObjectURL(file);

                            if (file.size > 4194304) {
                                const convertMB = (file.size / 1024 / 1024).toFixed(2);
                                there.Notification.error({ message: `file size: ${convertMB} MB > maximum: 4 MB`, positionY: 'top', positionX: 'right' });
                                return;
                            }

                            switch (there.objVideo.options.img.imgOption) {
                                case 'header':
                                    if (that.compareImage(640, 280, image.width, image.height)) {
                                        there.vidHandleUploadFileServer(file, 'header');
                                    } else {
                                        if (there.$rootScope.isLang === 'VN') {
                                            there.Notification.error({ message: `Vui lòng upload hình ảnh theo tỉ lệ 640 x 280 (rộng x cao)`, positionY: 'top', positionX: 'right' });
                                        } else {
                                            there.Notification.error({ message: `Please upload image with 640 x 280 (width x height) aspect ratio`, positionY: 'top', positionX: 'right' });
                                        }
                                    }
                                    break;
                                case 'footer':
                                    if (that.compareImage(640, 310, image.width, image.height)) {
                                        there.vidHandleUploadFileServer(file, 'footer');
                                    } else {
                                        if (there.$rootScope.isLang === 'VN') {
                                            there.Notification.error({ message: `Vui lòng upload hình ảnh theo tỉ lệ 640 x 310 (rộng x cao)`, positionY: 'top', positionX: 'right' });
                                        } else {
                                            there.Notification.error({ message: `Please upload image with 640 x 310 (width x height) aspect ratio`, positionY: 'top', positionX: 'right' });
                                        }
                                    }
                                    break;
                                default:
                                    if (that.compareImage(640, 360, image.width, image.height)) {
                                        there.vidHandleUploadFileServer(file, 'poster');
                                    } else {
                                        if (there.$rootScope.isLang === 'VN') {
                                            there.Notification.error({ message: `Vui lòng upload hình ảnh theo tỉ lệ 640 x 360 (rộng x cao)`, positionY: 'top', positionX: 'right' });
                                        } else {
                                            there.Notification.error({ message: `Please upload image with 640 x 360 (width x height) aspect ratio`, positionY: 'top', positionX: 'right' });
                                        }
                                    }
                                    break;
                            }
                        }
                    }

                    reader.readAsDataURL(file);
                    done(new Error());
                },
            });

            dropzone.on('complete', function (file) {
                dropzone.removeAllFiles(true);
            });

            const dropzoneVid = new Dropzone("#dropzoneVideo", {
                url: '/uploads',
                paramName: "file",
                maxFiles: 1,
                maxFilesize: 24,
                acceptedFiles: ".mp4, .webm, .ogv, .ogg",
                dictDefaultMessage: that.$rootScope.isLang === 'VN' ? 'Kéo thả video vào đây hoặc click để chọn video cần upload' : 'Drop a new video here, or click to select video to upload.',
                accept: function (file, done) {
                    const reader = new FileReader();

                    reader.onload = (e) => {
                        file.preview = URL.createObjectURL(file);

                        if (file.size > 6291456) {
                            const convertMB = (file.size / 1024 / 1024).toFixed(2);
                            there.Notification.error({ message: `file size: ${convertMB} MB > maximum: 6 MB`, positionY: 'top', positionX: 'right' });
                            return;
                        }
                        there.vidHandleUploadFileServer(file, 'video');
                    }

                    reader.readAsDataURL(file);
                    done(new Error());
                },
            });

            dropzoneVid.on('complete', function (file) {
                dropzoneVid.removeAllFiles(true);
            });
            return;
        }
    }

    that.onVideoCalPlusMinus = (cssProp, value) => {
        if (that.objVideo.options.btn[cssProp].includes('%')) {
            if (value === 'minus') {
                value = parseInt(that.objVideo.options.btn[cssProp].slice(0, -1)) - 1;
            }

            if (value === 'plus') {
                value = parseInt(that.objVideo.options.btn[cssProp].slice(0, -1)) + 1;
            }
            return `${value}%`;
        } else if (that.objVideo.options.btn[cssProp].includes('px')) {
            if (value === 'minus') {
                value = parseInt(that.objVideo.options.btn[cssProp].slice(0, -2)) - 1;
                value = (value < 0) ? 0 : value;
            }

            if (value === 'plus') {
                value = parseInt(that.objVideo.options.btn[cssProp].slice(0, -2)) + 1;
            }
            return `${value}px`;
        }
        return that.objVideo.options.btn[cssProp];
    }

    that.onVideoChangeSettings = (type, cssProp, value) => {
        switch (type) {
            case 'body':
                that.objVideo.options.body[cssProp] = value;
                break;
            case 'btn':
                if ((value === 'minus') || (value === 'plus')) {
                    value = that.onVideoCalPlusMinus(cssProp, value);
                }

                if (cssProp === 'btnPaddingOption') {
                    if (that.objVideo.options.btn[cssProp] === 'more') {
                        that.objVideo.options.btn['paddingTop'] = that.objVideo.options.btn['padding'];
                        that.objVideo.options.btn['paddingRight'] = that.objVideo.options.btn['padding'];
                        that.objVideo.options.btn['paddingBottom'] = that.objVideo.options.btn['padding'];
                        that.objVideo.options.btn['paddingLeft'] = that.objVideo.options.btn['padding'];
                    } else {
                        that.objVideo.options.btn['padding'] = that.objVideo.options.btn['paddingTop'];
                    }
                }

                if (cssProp === 'btnBorderOption') {
                    if (that.objVideo.options.btn[cssProp] === 'more') {
                        that.objVideo.options.btn['borderTopWidth'] = that.objVideo.options.btn['borderWidth'];
                        that.objVideo.options.btn['borderRightWidth'] = that.objVideo.options.btn['borderWidth'];
                        that.objVideo.options.btn['borderBottomWidth'] = that.objVideo.options.btn['borderWidth'];
                        that.objVideo.options.btn['borderLeftWidth'] = that.objVideo.options.btn['borderWidth'];
                        that.objVideo.options.btn['borderTopStyle'] = that.objVideo.options.btn['borderStyle'];
                        that.objVideo.options.btn['borderRightStyle'] = that.objVideo.options.btn['borderStyle'];
                        that.objVideo.options.btn['borderBottomStyle'] = that.objVideo.options.btn['borderStyle'];
                        that.objVideo.options.btn['borderLeftStyle'] = that.objVideo.options.btn['borderStyle'];
                        that.objVideo.options.btn['borderTopColor'] = that.objVideo.options.btn['borderColor'];
                        that.objVideo.options.btn['borderRightColor'] = that.objVideo.options.btn['borderColor'];
                        that.objVideo.options.btn['borderBottomColor'] = that.objVideo.options.btn['borderColor'];
                        that.objVideo.options.btn['borderLeftColor'] = that.objVideo.options.btn['borderColor'];
                    } else {
                        that.objVideo.options.btn['borderWidth'] = that.objVideo.options.btn['borderTopWidth'];
                        that.objVideo.options.btn['borderStyle'] = that.objVideo.options.btn['borderTopStyle'];
                        that.objVideo.options.btn['borderColor'] = that.objVideo.options.btn['borderTopColor'];
                    }
                }

                if (cssProp === 'textAlign' && value === 'center') {
                    that.objVideo.options.btn['xDirection'] = '0%';
                }

                if (value) {
                    that.objVideo.options.btn[cssProp] = value;
                }
                break;
            default:
                break;
        }
        that.onVideoResetTemplate(that.objVideo.options);
    }

    that.onVideoResetTemplate = (settings) => {
        setTimeout(() => {
            let iframe = document.querySelector('iframe#video-choosed');
            if (iframe) {
                iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
                if (iframe.document) {
                    const document = iframe.document;
                    if (document.querySelector('html')) {
                        const body = document.querySelector('body');
                        const main_video = document.querySelector('body .main_video');
                        const headerImg = main_video.querySelector('.header > img');
                        const footerImg = main_video.querySelector('.bottom  > img');
                        const posterVidImg = main_video.querySelector('.content > video');
                        const divBtnLogin = main_video.querySelector('.bottom .divBtnLogin');
                        const button = main_video.querySelector('.bottom .divBtnLogin > button');
                        const sheetToBeRemoved = document.getElementById('vidStyleSheetId');
                        const allElements = document.querySelectorAll('*');

                        for (let i = 0; i < allElements.length; i++) {
                            const element = allElements[i];
                            element.style.fontFamily = settings.body.fontFamily;
                        }

                        if (body) {
                            body.style.backgroundColor = settings.body.backgroundColor;
                        }

                        if (headerImg) {
                            if (settings.img.enableHeaderImg === "on") {
                                headerImg.src = settings.img.headerImg;
                            } else {
                                headerImg.src = "";
                            }
                        }

                        if (footerImg) {
                            if (settings.img.enableFooterImg === "on") {
                                footerImg.src = settings.img.footerImg;
                                footerImg.style.opacity = 1;
                                footerImg.style.visibility = "initial";
                            } else {
                                footerImg.style.opacity = 0;
                                footerImg.style.visibility = "hidden";
                            }
                        }

                        if (posterVidImg) {
                            if (settings.img.enablePosterImg === "on") {
                                posterVidImg.setAttribute("poster", settings.img.posterImg);
                            } else {
                                posterVidImg.setAttribute("poster", "");
                            }

                            if (!settings.video.videoSrc.includes(posterVidImg.getAttribute('src'))) {
                                posterVidImg.src = settings.video.videoSrc;
                            }
                        }

                        if (divBtnLogin) {
                            divBtnLogin.style.left = settings.btn.xDirection;
                            divBtnLogin.style.textAlign = settings.btn.textAlign;
                        }

                        if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                            const sheetParent = sheetToBeRemoved.parentNode;
                            sheetParent.removeChild(sheetToBeRemoved);
                            let style = document.createElement('style');
                            style.id = "vidStyleSheetId";
                            style.innerHTML = `.divBtnLogin::before{ height: ${settings.btn.yDirection} }`;
                            document.querySelector('head').appendChild(style);
                        } else {
                            let style = document.createElement('style');
                            style.id = "vidStyleSheetId";
                            style.innerHTML = `.divBtnLogin::before{ height: ${settings.btn.yDirection} }`;
                            document.querySelector('head').appendChild(style);
                        }

                        if (button) {
                            button.style.backgroundColor = settings.btn.backgroundColor;
                            button.style.color = settings.btn.color;
                            button.style.borderRadius = settings.btn.borderRadius;
                            button.style.fontWeight = settings.btn.fontWeight;

                            if (settings.btn.btnBorderOption === 'allsides') {
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

                            if (settings.btn.btnPaddingOption === 'allsides') {
                                button.style.padding = settings.btn.padding;
                            } else {
                                button.style.paddingTop = settings.btn.paddingTop;
                                button.style.paddingRight = settings.btn.paddingRight;
                                button.style.paddingBottom = settings.btn.paddingBottom;
                                button.style.paddingLeft = settings.btn.paddingLeft;
                            }

                            button.innerHTML = settings.btn.text;
                        }
                    }
                }
            }
        }, 200);
    }

    that.vidGenerateHTML = () => {
        that.vidSaveDesign = true;
        document.querySelector('#vidOverlayBg').style.display = 'block';
        const generate = lodash.cloneDeep(that.objVideo);
        const settings = generate.options;

        let iframe = document.createElement('iframe');
        iframe.id = 'template-generate-video';
        iframe.width = '0';
        iframe.height = '0';
        iframe.style.border = 'none';

        let container = document.getElementById('videoGenerateHTML');
        if (container.childNodes[0]) {
            container.removeChild(container.childNodes[0]);
        }
        container.appendChild(iframe);
        iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;
        iframe.document.open();
        iframe.document.write("");
        iframe.document.write(generate.htmlCode);
        iframe.document.close();

        setTimeout(() => {
            let getiframe = document.querySelector('iframe#template-generate-video');
            if (getiframe) {
                getiframe = getiframe.contentWindow || getiframe.contentDocument.document || getiframe.contentDocument;

                if (getiframe.document) {
                    const document = getiframe.document;
                    if (document.querySelector('html')) {
                        const body = document.querySelector('body');
                        const main_video = document.querySelector('body .main_video');
                        const headerImg = main_video.querySelector('.header > img');
                        const footerImg = main_video.querySelector('.bottom  > img');
                        const posterVidImg = main_video.querySelector('.content > video');
                        const overLayVideo = main_video.querySelector('.over_lay_video');
                        const button = main_video.querySelector('.bottom .divBtnLogin > button');
                        const sheetToBeRemoved = document.getElementById('vidStyleId');
                        let buttonClassList = null;

                        if (button.classList.length) {
                            buttonClassList = button.classList[0];
                        }

                        if (sheetToBeRemoved && sheetToBeRemoved !== null) {
                            const sheetParent = sheetToBeRemoved.parentNode;
                            sheetParent.removeChild(sheetToBeRemoved);
                        } else {
                            let style = document.createElement('style');
                            style.id = "vidStyleId";
                            style.innerHTML = `
                                    * {
                                        font-family: ${settings.body.fontFamily};
                                    }

                                    body {
                                        background-color: ${settings.body.backgroundColor};
                                    }

                                    .divBtnLogin {
                                        left: ${settings.btn.xDirection};
                                        text-align: ${settings.btn.textAlign};
                                    }

                                    .divBtnLogin:before {
                                        height: ${settings.btn.yDirection};
                                    }

                                    ${buttonClassList ? `.${buttonClassList} {
                                        color: ${settings.btn.color};
                                        background-color: ${settings.btn.backgroundColor};
                                        ${
                                    (settings.btn.btnBorderOption === 'allsides') ? `
                                                border-style: ${settings.btn.borderStyle} !important;
                                                border-width: ${settings.btn.borderWidth} !important;
                                                border-color: ${settings.btn.borderColor} !important;
                                            ` : `
                                                border-style: ${settings.btn.borderStyle};
                                                border-width: ${settings.btn.borderWidth};
                                                border-color: ${settings.btn.borderColor};
                                            `
                                    }
                                        border-top-style: ${settings.btn.borderTopStyle};
                                        border-top-width: ${settings.btn.borderTopWidth};
                                        border-top-color: ${settings.btn.borderTopColor};
                                        border-right-style: ${settings.btn.borderRightStyle};
                                        border-right-width: ${settings.btn.borderRightWidth};
                                        border-right-color: ${settings.btn.borderRightColor};
                                        border-bottom-style: ${settings.btn.borderBottomStyle};
                                        border-bottom-width: ${settings.btn.borderBottomWidth};
                                        border-bottom-color: ${settings.btn.borderBottomColor};
                                        border-left-style: ${settings.btn.borderLeftStyle};
                                        border-left-width: ${settings.btn.borderLeftWidth};
                                        border-left-color: ${settings.btn.borderLeftColor};
                                        border-radius: ${settings.btn.borderRadius};
                                        font-weight: ${settings.btn.fontWeight};
                                        ${
                                    (settings.btn.btnPaddingOption === 'allsides') ? `
                                            padding: ${settings.btn.padding} !important;
                                        ` : `
                                            padding: ${settings.btn.padding};
                                        `
                                    }
                                        padding-bottom: ${settings.btn.paddingTop};
                                        padding-left: ${settings.btn.paddingLeft};
                                        padding-right: ${settings.btn.paddingRight};
                                        padding-top: ${settings.btn.paddingTop};

                                    }
                                    ` : ''}

                                    ${buttonClassList ? `.${buttonClassList}:disabled {
                                        background-color: #B3B3B3;
                                    }` : ''}

                                    ${
                                (settings.img.enableFooterImg === "off") ? `
                                        .bottom  > img {
                                            opacity: 0;
                                            visibility: hidden;
                                        }
                                        `: ''
                                }
                                `;
                            document.querySelector('head').appendChild(style);
                        }

                        if (body) {
                            if (settings.video.displayTimeBtn === 'custom') {
                                body.setAttribute('onload', `loadBtn(${parseInt(settings.video.displayTimeBtnCustom) * 1000})`);
                            } else {
                                body.setAttribute('onload', `loadBtn(${parseInt(settings.video.displayTimeBtn) * 1000})`);
                            }
                        }

                        if (headerImg) {
                            if (settings.img.enableHeaderImg === "on") {
                                headerImg.src = settings.img.headerImg;
                            } else {
                                headerImg.src = "";
                            }
                        }

                        if (footerImg) {
                            if (settings.img.enableFooterImg === "on") {
                                footerImg.src = settings.img.footerImg;
                            } else {
                                footerImg.src = "";
                            }
                        }

                        if (posterVidImg) {
                            if (settings.img.enablePosterImg === "on") {
                                posterVidImg.setAttribute("poster", settings.img.posterImg);
                            } else {
                                posterVidImg.setAttribute("poster", "");
                            }

                            posterVidImg.src = settings.video.videoSrc;

                            if (settings.video.muted || settings.video.muted === 'true') {
                                posterVidImg.setAttribute("muted", "");
                            } else {
                                posterVidImg.removeAttribute("muted");
                            }

                            if (settings.video.autoPlay || settings.video.autoPlay === 'true') {
                                posterVidImg.setAttribute("autoplay", "");
                            } else {
                                posterVidImg.removeAttribute("autoplay");
                            }
                        }

                        if (overLayVideo) {
                            if (settings.video.displayTimeBtn === 'custom') {
                                overLayVideo.setAttribute('onclick', `onPlay(${parseInt(settings.video.displayTimeBtnCustom)})`);
                            } else {
                                overLayVideo.setAttribute('onclick', `onPlay(${parseInt(settings.video.displayTimeBtn)})`);
                            }
                        }

                        if (button) {
                            button.innerHTML = settings.btn.text;
                        }

                        that.vidGeneratedHTML = `
                            <!DOCTYPE html>
                                <html lang="en">
                                    ${document.querySelector('html').innerHTML}
                                </html>
                            `;
                    }
                }
            }

            document.querySelector('#vidOverlayBg').style.display = 'none';
        }, 5000);
    }

    // create video
    that.vidReplaceImage = ({ header, footer, poster, video }) => {
        let iframe = document.querySelector('iframe#template-generate-video');
        if (iframe) {
            iframe = iframe.contentWindow || iframe.contentDocument.document || iframe.contentDocument;

            if (iframe.document) {
                const document = iframe.document;

                if (document.querySelector('html')) {
                    const main_video = document.querySelector('body .main_video');
                    const headerImg = main_video.querySelector('.header > img');
                    const footerImg = main_video.querySelector('.bottom  > img');
                    const posterVidImg = main_video.querySelector('.content > video');
                    const divBtnLogin = main_video.querySelector('.bottom .divBtnLogin');

                    if (main_video) {
                        main_video.removeAttribute('style');
                    }

                    if (divBtnLogin) {
                        divBtnLogin.removeAttribute('style');
                    }

                    if (headerImg) {
                        if (header) { headerImg.src = header || ''; }
                    }

                    if (footerImg) {
                        if (footer) { footerImg.src = footer || ''; }
                    }

                    if (posterVidImg) {
                        if (poster) { posterVidImg.setAttribute("poster", poster || ''); }
                        if (video) { posterVidImg.src = video || ''; }
                    }

                    that.vidGeneratedHTML = `<!DOCTYPE html><html lang="en">${document.querySelector('html').innerHTML}</html>`;
                }
            }
        }
    }

    that.vidUploadFileToCloud = (data, saveObj) => {
        if (!lodash.isEmpty(data)) {
            return that.checkCloud()
                .then(pass => {
                    if (pass && pass.data.access_token) {
                        return Promise.all([
                            data.header ? that.requestUploadCloud(data.header, pass.data.access_token) : '',
                            data.footer ? that.requestUploadCloud(data.footer, pass.data.access_token) : '',
                            data.poster ? that.requestUploadCloud(data.poster, pass.data.access_token) : '',
                            data.video ? that.requestUploadCloud(data.video, pass.data.access_token) : '',
                            pass.data.access_token
                        ])
                    }
                    return [];
                })
                .then(([header, footer, poster, video, accessToken]) => {
                    that.vidReplaceImage({ header: header ? header : '', footer: footer ? footer : '', poster: poster ? poster : '', video: video ? video : '' });
                    setTimeout(() => {
                        that.vidSaveDB(saveObj, header, footer, poster, video, accessToken);
                    }, 1500);
                })
                .catch(() => {
                    if (that.obj.id) {
                        that.alertify.error(that.Messages.updateFailed);
                    } else {
                        that.alertify.error(that.Messages.createFailed);
                    }
                    document.querySelector('#vidOverlayBg').style.display = 'none';
                });
        }

        that.vidReplaceImage({ header: '', footer: '', poster: '', video: '' });
        return setTimeout(() => {
            that.vidSaveDB(saveObj);
        }, 1500);
    }

    that.createVideo = () => {
        that.vidSaveDesign = false;
        document.querySelector('#vidOverlayBg').style.display = 'block';
        let saveObj = lodash.cloneDeep(that.objVideo);

        that.vidUploadFileToCloud(that.vidSaveFileTmp, saveObj);
    }

    that.vidSaveDB = (saveObj, header, footer, poster, video, accessToken) => {
        saveObj.htmlCode = that.setLoginCode(that.vidGeneratedHTML);
        saveObj.name = that.obj.name || '';
        saveObj.type = that.obj['type'] || 'Banner';
        if (saveObj.options['video']['displayTimeBtn'] && saveObj.options['video']['displayTimeBtn'] !== 'custom') {
            saveObj.options['video']['displayTimeBtn'] = parseInt(saveObj.options['video']['displayTimeBtn']);
        }

        if (saveObj.options['video']['displayTimeBtnCustom']) {
            saveObj.options['video']['displayTimeBtnCustom'] = parseInt(saveObj.options['video']['displayTimeBtnCustom']);
        } else {
            saveObj.options['video']['displayTimeBtnCustom'] = 0;
        }

        saveObj.options['templateType'] = that.obj.templateType;

        if (header) {
            saveObj.options['img']['headerImg'] = header;
        }

        if (footer) {
            saveObj.options['img']['footerImg'] = footer;
        }

        if (poster) {
            saveObj.options['img']['posterImg'] = poster;
        }

        if (video) {
            saveObj.options['video']['videoSrc'] = video;
        }

        saveObj = lodash.omit(saveObj, 'id');

        that.vidGeneratedHTML = '';
        that.vidSaveFileTmp = {};

        if (document.getElementById('edit-handle-video').childNodes[0]) {
            document.getElementById('edit-handle-video').childNodes[0].src = "";
        }

        if (document.getElementById('videoGenerateHTML').childNodes[0]) {
            document.getElementById('videoGenerateHTML').childNodes[0].src = "";
        }

        if (that.objVideo.id) {
            saveObj.updatedAt = moment().valueOf();

            that.Banner.replaceById({ id: that.objVideo.id }, saveObj).$promise
                .then((data) => {
                    that.alertify.success(that.Messages.updateSuccess);
                    delete data.$promise;
                    delete data.$resolved;
                    that.updateRow(that.obj, data, 'banners');
                    that.mode = 'banner';
                    $('#fmEdit').modal('hide');
                })
                .catch(() => {
                    that.alertify.error(that.Messages.updateFailed);
                }).finally(() => {
                    document.querySelector('#vidOverlayBg').style.display = 'none';
                });
        } else {
            saveObj.createdAt = moment().valueOf();
            saveObj.updatedAt = moment().valueOf();

            that.Banner.create(saveObj).$promise
                .then((data) => {
                    that.alertify.success(that.Messages.createSuccess);
                    that.updateRow(null, data, 'banners');
                    that.mode = 'banner';
                    $('#fmEdit').modal('hide');
                })
                .catch(() => {
                    that.alertify.error(that.Messages.createFailed);
                }).finally(() => {
                    document.querySelector('#vidOverlayBg').style.display = 'none';
                    setTimeout(() => {
                        if (that.$rootScope && that.$rootScope.createdGuidance && that.$rootScope.createdGuidance === 'started') {
                            return that.$state.go('admin.account', { guidance: true, created: moment().valueOf() });
                        }
                    }, 50);
                });
        }

        if (accessToken) {
            that.logoutCloud(accessToken);
        }
    }

    return that;
};

export {
    initVideo
};