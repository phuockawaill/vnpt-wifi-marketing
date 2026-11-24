/* eslint no-new:0 */
import Select2 from 'select2/dist/js/select2.full';
import _difference from 'lodash/difference';
import _find from 'lodash/find';
import _pullAll from 'lodash/pullAll';

// Custom dataAdapter
const ArrayAdapter = $.fn.select2.amd.require('select2/data/array');

ArrayAdapter.prototype.updateOptions = function updateOptions(data) {
  const selected = this.$element.val();
  if (selected) {
    const newItem = data.find(item => item.id === selected);
    if (newItem) {
      newItem.selected = true;
    }
  }

  const currentIds = Array.prototype.map
    .call(this.$element.find('option'), item => item.getAttribute('value'));
  const newIds = data.reduce((all, item) => {
    if (Array.isArray(item.children)) {
      return all.concat(item.children.map(child => child.id.toString()));
    }
    all.push(item.id.toString());
    return all;
  }, []);

  const removedIds = _difference(currentIds, newIds);

  this.$element.find('option').each((idx, item) => {
    if (removedIds.indexOf(item.getAttribute('value') > -1)) {
      item.parentNode.removeChild(item);
    }
  }); // remove all options
  this.addOptions(this.convertToOptions(data));
};

class Select {
  constructor($timeout) {
    this.$timeout = $timeout;

    this.scope = {
      options: '=select2',
    };
    this.require = 'ngModel';
  }

  copyData(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      const newItem = { id: item.id, text: item.text };
      if (item.selected) {
        newItem.selected = true;
      }
      if (item.disabled) {
        newItem.disabled = true;
      }
      if (Array.isArray(item.children)) {
        newItem.children = this.copyData(item.children);
      }

      return newItem;
    });
  }

  link(scope, ele, attrs, ngModel) {
    ele = $(ele);
    ele.on('select2:select', () => {
      ngModel.$setDirty();
    });
    ele.on('select2:selecting', e => $(e.currentTarget).data('scrolltop', $('.select2-results__options').scrollTop()));

    let select;
    const options = {};
    Object.keys(scope.options).forEach((key) => {
      if (key === 'data') return;
      options[key] = scope.options[key];
    });

    if (Array.isArray(scope.options.data)) {
      options.data = [];
      scope.$watchCollection('options.data', (newData) => {
        options.data = this.copyData(newData);
        if (options.placeholder && !('multiple' in attrs)) {
          options.data.unshift({ id: '', value: '' });
        }

        select.$element.data('select2').dataAdapter.updateOptions(options.data);
        ngModel.$setPristine();
      });
    }
    select = new Select2(ele, options);

    if(options.dropdownCssClass === 'selectLocation'){
        select.$element.on('select2:open', function () {
            setTimeout(()=>{
                if(!$('.selectLocation ul.select2-results__options')[0]) return;
                let groups = $('.selectLocation ul.select2-results__options')[0].children;
                for(let i=0;i<groups.length;i++){
                    groups[i].children[0].style.cursor = 'pointer';
                    $(groups[i].children[0]).hover(function(){
                          $(this).css("background", "lightgrey");
                    }, function(){
                          $(this).css("background", "none");
                    });
                    $(groups[i].children[0]).click(()=>{
                        let isClear = true;
                        options.data[i].children.forEach((item)=>{
                            if(!_find(select.$element.select2('data'), {id: item.id})){
                                isClear = false;
                            }
                        });
                        if(isClear){
                          $(groups[i]).find('.select2-results__option').toArray().forEach((e)=>{
                               e.setAttribute('aria-selected', false);
                          });
                          select.$element.val(_pullAll(select.$element.select2('data').map((item)=>item.id), options.data[i].children.map((item)=>item.id)));
                        } else {
                          $(groups[i]).find('.select2-results__option').toArray().forEach((e)=>{
                               e.setAttribute('aria-selected', true);
                          });
                          select.$element.val(options.data[i].children.map((item)=>item.id).concat(select.$element.select2('data').map((item)=>item.id)));
                        }
                        select.$element.trigger("change");
                       //objLocs
                    });
                }
            }, 500);
        });
    }

    ngModel.$formatters.push((value) => {
      this.$timeout(() => {
        select.$element.val(value || null).trigger('change');
      });
      return value;
    });
  }

  static factory($timeout) {
    'ngInject';

    return new Select($timeout);
  }
}

export default angular
  .module('app.directive.select2', [])
  .directive('select2', Select.factory);
