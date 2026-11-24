const quality = {
    "1": "Rất không hài lòng",
    "2": "Không hài lòng",
    "3": "Bình thường",
    "4": "Hài lòng",
    "5": "Rất hài lòng",
};
const render = (params)=>{
    let returnData = params.value, dataField = params.colDef.field, value = params.value, addSource = '';
    if(dataField.indexOf('audience')>-1){
        dataField = params.colDef.field.split('.')[1];
    }
    if(params.data){
        if(params.data['fb'] && params.data['fb'][dataField]){
            params.value = params.data['fb'][dataField];
            addSource = ' [<a class="detailSrc" data-toggle="popoverSrc" data-content="From Facebook Sign-in">F</a>]';
        } else if(params.data['google'] && params.data['google'][dataField]){
            params.value = params.data['google'][dataField];
            addSource = ' [<a class="detailSrc" data-toggle="popoverSrc" data-content="From Google Sign-in">G</a>]';
        } else if(params.data['zalo'] && params.data['zalo'][dataField]){
            params.value = params.data['zalo'][dataField];
            addSource = ' [<a class="detailSrc" data-toggle="popoverSrc" data-content="From Zalo Sign-in">Z</a>]';
        } else if(params.data['twitter'] && params.data['twitter'][dataField]){
            params.value = params.data['twitter'][dataField];
            addSource = ' [<a class="detailSrc" data-toggle="popoverSrc" data-content="From Twitter Sign-in">T</a>]';
        } else if(value){ addSource = ' [<a class="detailSrc" data-toggle="popoverSrc" data-content="From Survey page">S</a>]'; }
    }
    switch (dataField) {
        case 'income':
            switch (params.value) {
                case 'under_$300':
                  returnData = '<span class="text-orange-300">< $300</span>';break;
                case '_$300_to_$600':
                  returnData = '<span class="text-orange">$300 to $600</span>';break;
                case '_$700_to_$1200':
                  returnData = '<span class="text-orange-700">$700 to $1200</span>';break;
                case '_$1300_to_$2000':
                  returnData = '<span class="text-danger-400">$1300 to $2000</span>';break;
                case 'higher_$2000':
                  returnData = '<span class="text-danger-600">> $2000</span>';break;
                default:
                  returnData = '<p class="text-muted" style="min-width: 120px; text-align:right">Unknown</p>';
            }
            break;
        case 'age':
            switch (params.value) {
              case 'under_18':
                returnData = '<span class="text-blue-300">< 18</span>';break;
              case '18_to_24':
                returnData = '<span class="text-blue">18 to 24</span>';break;
              case '25_to_34':
                returnData = '<span class="text-blue-800">25 to 34</span>';break;
              case '35_to_44':
                returnData = '<span class="text-violet-400">35 to 44</span>';break;
              case 'higher_45':
                returnData = '<span class="text-violet-600">> 45</span>';break;
              default:
                returnData = '<p class="text-muted" style="min-width: 120px; text-align:right">Unknown</p>';
            }
            break;
        case 'gender':
            switch (params.value) {
              case 'male':
                returnData = '<span class="text-indigo-400">Male</span>';break;
              case 'female':
                returnData = '<span class="text-pink-400">Female</span>';break;
              default:
                returnData = '<p class="text-muted" style="min-width: 120px; text-align:right">Unknown</p>';
            }
            break;
    }

    if(dataField.split('.')[0] === 'survey' && params.colDef.showCountPoint){
        returnData = quality[params.value] || params.value;
    }

    setTimeout(()=>{
        $('[data-toggle="popoverSrc"]').popover({
            trigger: 'hover',
            placement: 'left'
        });
    }, 200);
    if(!returnData){
        returnData = params.value;
    }
    if(params.value){
        return '<p style="min-width: 120px; text-align:right">'+returnData + addSource+'</p>';
    }
    return returnData;
}
export default render;
