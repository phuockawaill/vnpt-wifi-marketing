import { h, Component } from 'preact';
import moment from 'moment';
import axios from 'axios';
import config from 'asset/config';

import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/FontIcon';

import Quill from 'quill';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.bubble.css';

export default class TranslateForm extends Component {
    constructor(props){
        super(props);
        this.state = {currentWord: 0, currentSentence: props.translateDoc.translated.split('.').length-1};
        this.quillEditorSrc = null;
        this.quillEditor = null;
    }
    getHtmlText(type) {
      if(type){
          let content = document.getElementById('editor').firstChild.innerHTML;
          this.props.getValue(content)
      }else{
          this.props.getValue()
      }
    }
    componentDidMount() {
        let that = this, totalChar=0, contentData;
        // console.log(this.refs.srcDoc);
        // let elementSrc = findDOMNode(this.refs.srcDoc);
        this.quillEditorSrc = new Quill('#srcDoc', {
            theme: 'bubble',
            readOnly: true
        });
        document.getElementById('srcDoc').firstChild.innerHTML = this.props.translateDoc.content;
        contentData = that.props.translateDoc.content.split('.').map((item)=>{
            totalChar+=item.length+1;
            return item.length;
        });
        this.quillEditorSrc.formatText(0, this.props.translateDoc.content.split('.')[0].length, {
            'background-color': 'yellow'
        });

        // let elementDoc = findDOMNode(this.refs.editor);
        this.quillEditor = new Quill('#editor', {
            theme: 'bubble'
        });
        document.getElementById('editor').firstChild.innerHTML = this.props.translateDoc.translated || '';
        // document.getElementById('editor').firstChild.innerHTML = this.props.value;
        this.quillEditor.on('text-change', function(delta, oldDelta, source) {
          if (source == 'user') {
            processHighLight(that.quillEditorSrc, that.quillEditor, contentData, delta, totalChar, that);
          }
        });
        this.quillEditor.on('selection-change', function(range, oldDelta, source) {
          if (source === 'user' && range) {
              let deltaSelect = that.quillEditor.getContents(0, range.index);
              let curentContent = deltaSelect.ops[0]?deltaSelect.ops[0].insert:'';
              let startIdx = curentContent.split('.').length-1;
              let endIdx=0;
              for(let i = 0;i<startIdx;i++){
                  endIdx+=contentData[i]+1;
              }
              that.quillEditorSrc.removeFormat(0, totalChar);
              that.quillEditorSrc.formatText(endIdx, contentData[startIdx], {
                  'background-color': 'yellow'
              });
          }
        });
    }
    saveDoc(){
        axios.post(config.serverPath+'/documents/save/'+this.props.translateDoc._id, {
            status: 1,
            translated: this.quillEditor.getContents(0, this.quillEditor.getLength()).ops[0].insert,
        })
        .then((response) => {
            alert('success');
        })
        .catch((error)=>{
            console.log(error);
        });
    }
    render(){
        return (
            <div>
                <div class="toolbar-view">
                    <div class="toolbar-group">
                        <CountDownTime duration={this.props.translateDoc.averageTime} />
                        <div class="split-toolbar-view"></div>
                        <h4 style={{margin: 0, lineHeight: '48px'}}>{this.state.currentSentence}/{this.props.translateDoc.content.split('.').length - 1} sentences</h4>
                    </div>
                    <div>&nbsp;</div>
                    <div class="toolbar-group">
                        <IconButton tooltip="Save" touch={true} onClick={()=>this.saveDoc()} ><Icon class="material-icons">save</Icon></IconButton>
                        <div class="split-toolbar-view"></div>
                        <IconButton tooltip="Finish" touch={true} ><Icon class="material-icons">check</Icon></IconButton>
                    </div>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                    <div style={{width: '48%', border: '1px solid', height: window.innerHeight - 130}}>
                        <div id="srcDoc"></div>
                    </div>
                    <div style={{width: '48%', border: '1px solid', height: window.innerHeight - 130}}>
                        <div id="editor"></div>
                    </div>
                </div>
            </div>
        );
    }
}

function processHighLight(srcQuill, destQuill, content, delta, totalChar, that){
    let curentContent;
    if((delta.ops[0] && delta.ops[0].insert === '.') || (delta.ops[1] && delta.ops[1].insert === '.')){//insert
        curentContent = destQuill.getContents().ops[0].insert;

    } else if((delta.ops[0] && delta.ops[0].delete) || (delta.ops[1] && delta.ops[1].delete)) {//delete
        curentContent = destQuill.getContents().ops[0].insert;
    }

    if(curentContent){
        that.setState({currentSentence: curentContent.split('.').length-1});
        let startIdx = curentContent.split('.').length-1;
        let endIdx=0;
        for(let i = 0;i<startIdx;i++){
            endIdx+=content[i]+1;
        }
        srcQuill.removeFormat(0, totalChar);
        srcQuill.formatText(endIdx, content[startIdx]-1, {
            'background-color': 'yellow'
        });
    }
}

class CountDownTime extends Component{
    constructor(props){
        super(props);
        this.state = {
            current: moment().valueOf(),
            duration: moment.duration(props.duration, 'hours')
        };
    }
    componentDidMount(){
        setInterval(()=>{
            this.setState((prevState, props) => {
                return {duration: moment.duration(prevState.duration - 1000, 'milliseconds')}
            });
        }, 1000);
    }
    render(){
        let {duration} = this.state;
        return <h4 style={{margin: 0, lineHeight: '48px'}}>{duration.hours() + ':' + duration.minutes() + ':' + duration.seconds()}</h4>;
    }
}
