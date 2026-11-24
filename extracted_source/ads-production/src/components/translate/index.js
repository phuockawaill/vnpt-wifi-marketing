import { h, Component } from 'preact';
import moment from 'moment';
import axios from 'axios';
import ssoLogin from 'asset/ssoLogin';
import config from 'asset/config';

import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import DatePicker from 'material-ui/DatePicker';
import Slider from 'material-ui/Slider';
import Subheader from 'material-ui/Subheader';

import ListGrid from './list';
import TranslateForm from './translateForm';
import VerifyForm from './verifyForm';

export default class Translate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            openCreate: false,
            pickedDoc: {},
            rowData: [],
            createDoc: {},
            mode: 'list'//translate, verify
        }
        this.getDocuments();
    }
    openCreateDocument(){
        this.setState({createDoc: {publish: false, expired: moment().valueOf(), level: 1, translated:''}, openCreate: true});
    }
    createDocument(){
        axios.post(config.serverPath+'/documents/create', {
            ...this.state.createDoc,
            createdAt: moment().valueOf(),
            createdBy: {
                _id: this.props.currentUser._id,
                username: this.props.currentUser.username
            },
            status: 0,
            type:'translate'
        })
        .then((response) => {
            this.getDocuments();
            this.setState({openCreate: false});
        })
        .catch((error)=>{
            console.log(error);
        });
    }
    getDocuments(){
        axios.get(config.serverPath+'/documents/data')
        .then((response) => {
            this.setState({rowData: response.data});
          })
        .catch((error)=>{
            console.log(error);
        });
    }
    setMode(mode){
        this.setState({mode});
    }
    selectTranslate(doc){
        axios.post(config.serverPath+'/documents/pick', {
            _id: doc._id
        })
        .then((response) => {
            this.setState({mode: 'translate', pickedDoc: doc});
        })
        .catch((error)=>{
            console.log(error);
        });
    }
    selectVerify(doc){
        axios.post(config.serverPath+'/documents/pickVerify', {
            _id: doc._id
        })
        .then((response) => {
            this.setState({mode: 'verify', pickedDoc: doc});
        })
        .catch((error)=>{
            console.log(error);
        });
    }
	render() {
        let { name, content, publish, expired, averageTime, level } = this.state.createDoc;
        let { openCreate, mode, pickedDoc } = this.state;
        console.log(this.props.currentUser);
		return (
			<div>
                {mode==='list'?
                    <div>
                        <div class="toolbar-view">
                            <div>&nbsp;</div>
                            <div class="toolbar-group">
                                <IconButton tooltip="Refresh" touch={true} onClick={this.getDocuments.bind(this)}><Icon class="material-icons">sync</Icon></IconButton>
                                <div class="split-toolbar-view"></div>
                                {
                                    this.props.currentUser.profile.name === 'admin'?
                                        <IconButton tooltip="Create" touch={true} onClick={this.openCreateDocument.bind(this)}><Icon class="material-icons">add</Icon></IconButton>
                                    :null
                                }

                            </div>
                        </div>
                        <ListGrid {...this.props} rowData={this.state.rowData} selectTranslate={this.selectTranslate.bind(this)} selectVerify={this.selectVerify.bind(this)} />
                    </div>
                :null}
                {mode==='translate'?<TranslateForm translateDoc={pickedDoc} setMode={this.setMode.bind(this)} />:null}
                {mode==='verify'?<VerifyForm verifyDoc={pickedDoc} setMode={this.setMode.bind(this)} />:null}
                <Dialog
                    modal={true}
                    open={openCreate}
                    title="New document"
                    actions={[
                        <FlatButton label="Close" onClick={()=>this.setState({openCreate: false})} />,
                        <FlatButton label="Save" primary={true} keyboardFocused={true} onClick={()=>this.createDocument()} />
                    ]}
                    titleClassName="dialog-title"
                    contentStyle={{width: 700}}
                    bodyStyle={{overflowY: 'auto'}}>
                    <TextField hintText="Name"
                        value={name}
                        onChange={({target}) => this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc,{name: target.value})}
                        })}
                    />
                    <br/>
                    <Checkbox label="Publish" checked={publish}
                        onCheck={() => this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc,{publish: !prevState.createDoc.publish})}
                        })}
                    />
                    <DatePicker floatingLabelText="Expire Date" mode="landscape" autoOk={true}
                        value={moment(expired).toDate()}
                        formatDate={(str)=>moment(str).format('DD-MM-YYYY')}
                        onChange={(ev, date)=>this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc, {
                                expired: moment(date).valueOf(),
                                averageTime: Math.round(moment(date).diff(moment().valueOf(), 'hour', true)/3)
                            })}
                        })}
                    />
                    <br/>
                    <TextField floatingLabelText="Average Time (Hour)"
                        value={averageTime}
                        onChange={({target}) => this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc,{averageTime: target.value})}
                        })}
                    />
                    <br/>
                    <Subheader>Level: {level}</Subheader>
                    <Slider min={1} max={3} step={1} value={level} style={{width: 200, marginBottom: 20, marginTop: 20}}
                        onChange={(ev, value)=>this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc,{level: value})}
                        })}
                    />
                    <TextField floatingLabelText="Content" multiLine={true} rows={5} rowsMax={5} style={{width: '100%'}}
                        value={content}
                        onChange={({target}) => this.setState((prevState, props) => {
                            return {createDoc: Object.assign({}, prevState.createDoc,{content: target.value})}
                        })}
                    />
                </Dialog>
			</div>
		);
	}
}
