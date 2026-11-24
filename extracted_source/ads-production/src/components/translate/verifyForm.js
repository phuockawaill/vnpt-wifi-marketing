import { h, Component } from 'preact';
import moment from 'moment';
import axios from 'axios';
import config from 'asset/config';

import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/FontIcon';
import {List, ListItem} from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Dialog from 'material-ui/Dialog';

export default class TranslateForm extends Component {
    constructor(props){
        super(props);
        this.state = {
            comments: props.verifyDoc.comments?props.verifyDoc.comments:props.verifyDoc.content.split('.').map(()=>({})),
            currentComment: {},
            currentIdx: null
        };
    }
    componentDidMount() {

    }
    onClickTranslateLine(idx){
        this.setState({
            currentIdx: idx,
            currentComment: this.state.comments[idx]
        });
    }
    onReviewChange(type, value){
        console.log('onReviewChange', type, value);
        this.setState((prevState) => {
            return {currentComment: Object.assign({}, prevState.currentComment,{[type]: value})}
        }, ()=>this.setState((prevState)=>{
            return {comments: [...prevState.comments.slice(0, prevState.currentIdx), prevState.currentComment, ...prevState.comments.slice(prevState.currentIdx+1)]}
        }));
    }
    reviewUpdate(idx, type, value){
        this.setState((prevState)=>{
            return {comments: [...prevState.comments.slice(0, idx), Object.assign({}, prevState.comments[idx], {[type]: value}), ...prevState.comments.slice(idx+1)]}
        })
    }
    saveCMT(){
        axios.post(config.serverPath+'/documents/save/'+this.props.verifyDoc._id, {
            // status: 1,
            comments: this.state.comments,
        })
        .then((response) => {
            alert('success');
            this.props.setMode('list')
        })
        .catch((error)=>{
            console.log(error);
        });
    }
    render(){
        let { verifyDoc } = this.props;
        let { comments, currentComment, currentIdx } = this.state;
        return (
            <div>
                <div class="toolbar-view">
                    <div class="toolbar-group">
                    </div>
                    <div>&nbsp;</div>
                    <div class="toolbar-group">
                        <IconButton tooltip="Cancel" touch={true} onClick={()=>this.props.setMode('list')}><Icon class="material-icons">clear</Icon></IconButton>
                        <div class="split-toolbar-view"></div>
                        <IconButton tooltip="Finish" touch={true} onClick={()=>this.saveCMT()} ><Icon class="material-icons">check</Icon></IconButton>
                    </div>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                    <div style={{width: '40%', height: window.innerHeight - 130, overflowX: 'auto'}}>
                        <List>
                            {verifyDoc.content.split('.').map((item, idx)=>{
                                return <ListItem style={idx===currentIdx?styles.selectLineSrc:null} key={idx} primaryText={item} onClick={()=>this.onClickTranslateLine(idx)}  />
                            })}
                        </List>
                    </div>
                    <div style={styles.split}></div>
                    <div style={{width: '40%', height: window.innerHeight - 130, overflowX: 'hidden', overflowY: 'auto'}}>
                        <List>
                            {verifyDoc.translated.split('.').map((item, idx)=>{
                                return <ListItem key={idx} primaryText={item}
                                    style={idx===currentIdx?styles.selectLine:null}
                                    innerDivStyle={comments[idx].type?comments[idx].type===1?styles.goodLine:styles.badLine:null}
                                    rightIconButton={
                                        <IconMenu menuStyle={{width: 120}} iconButtonElement={
                                            <IconButton tooltip="Review" tooltipPosition="bottom-left"><Icon class="material-icons">rate_review</Icon></IconButton>
                                        }>
                                            <MenuItem onClick={()=>this.reviewUpdate(idx, 'type', 0)}>OK</MenuItem>
                                            <MenuItem onClick={()=>this.reviewUpdate(idx, 'type', 1)} style={styles.goodLine} rightIcon={ <Icon style={styles.goodLine} className="fa fa-thumbs-o-up"></Icon> }>Good</MenuItem>
                                            <MenuItem onClick={()=>this.reviewUpdate(idx, 'type', 2)} style={styles.badLine} rightIcon={ <Icon className="fa fa-thumbs-o-down" style={styles.badLine}></Icon> }>Bad</MenuItem>
                                        </IconMenu>
                                    }
                                    onClick={()=>this.onClickTranslateLine(idx)}  />
                            })}
                        </List>
                    </div>
                    <div style={styles.split}></div>
                    <div style={{width: '20%', height: window.innerHeight - 130}}>
                        {currentIdx!==null?
                            <div>
                                <div style={{justifyContent: 'space-around', display: 'flex'}}>
                                    <RaisedButton label="OK" onClick={()=>this.onReviewChange('type', 0)} />
                                    <RaisedButton label="Good" primary={true} onClick={()=>this.onReviewChange('type', 1)} />
                                    <RaisedButton label="Bad" secondary={true} onClick={()=>this.onReviewChange('type', 2)} />
                                </div>
                                {currentComment.type && currentComment.type === 2 ?
                                    <TextField floatingLabelText="Comment" multiLine={true} rows={5} rowsMax={5} style={{width: '100%'}}
                                        value={currentComment.cmt}
                                        onChange={({target})=>this.onReviewChange('cmt', target.value)}
                                    />
                                :null}
                            </div>
                        :null}
                    </div>
                </div>
            </div>
        );
    }
}

const styles={
    split: {
        borderRight: "1px solid #ddd",
        width: 1,
        margin: '20px 0'
    },
    selectLineSrc: {
        backgroundColor: 'lightblue'
    },
    selectLine: {
        backgroundColor: 'yellow'
    },
    goodLine: { color: '#00C853' },
    badLine: { color: '#B71C1C' }
};
