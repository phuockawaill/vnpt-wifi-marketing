import('angularjs-slider/dist/rzslider.min.js');
import('angularjs-slider/dist/rzslider.min.css');
import _merge from 'lodash/merge';

class AppRzSlider {
    constructor() {
        this.restrict = 'E';
        this.template = `<rzslider rz-slider-model='vm.model' rz-slider-options='vm.sliderOptions' style='margin-left: 1%; width: 50%'></rzslider>`;
        this.scope = {};
        this.controller = function controllerFn() {
            this.sliderOptions = _merge(this.options)
        };
        this.controllerAs = 'vm';
        this.bindToController = {
            model: '=myModel',
            options: '=myOption'
        };
    }

    static factory() {
        'ngInject';

        AppRzSlider.instance = new AppRzSlider();
        return AppRzSlider.instance;
    }
}

export default angular
    .module('app.directive.app-rz-slider', [])
    .directive('appRzSlider', AppRzSlider.factory);