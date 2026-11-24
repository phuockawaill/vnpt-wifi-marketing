import { h, Component } from 'preact';
import moment from 'moment';

import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-balham.css';
import 'asset/styles/ag-pattern.css';

export default class ListDocument extends Component {
    constructor(props){
        super(props);
        this.gridOptions = {
            columnDefs: [
                {
                    headerName: '', pinned: 'left', width: 72, maxWidth: 72, minWidth: 72, suppressNavigable: true, enablePivot: false, suppressFilter: true,
                    cellClass: 'agaction',
                    suppressMenu: true,
                    cellRendererFramework: GridActions,
                    cellRendererParams: {selectTranslate: props.selectTranslate, selectVerify: props.selectVerify, currentUser: props.currentUser},
                    cellStyle: (params)=>{
                        if(params.node.floating){
                            return {display: 'none'};
                        }
                    }
                },
                {headerName: "Name", field: "name"},
                {headerName: "Level", field: "level"},
                {headerName: "Average Time", field: "averageTime"},
                {
                    headerName: "Upload At", field: "createdAt",
                    cellRenderer: (params)=>{
                        return moment(params.value).format('MMM DD, YYYY HH:mm');
                    }
                },
                {headerName: "Upload By", field: "createdBy.username"}
            ],
            enableColResize: true,
            suppressContextMenu: true,
            onGridReady: (grid)=>{
                this.gridApi=grid.api;
                // this.gridApi.showLoadingOverlay();
            }
        };
    }
    render(){
        return (
            <div
                class="ag-theme-balham"
                style={{ height: window.innerHeight - 130, width: '100%' }}
            >
                <AgGridReact
                    gridOptions={this.gridOptions}
                    rowData={this.props.rowData}>
                </AgGridReact>
            </div>
        );
    }
}

class GridActions extends Component{
    constructor(props){
        super(props);
        this.state = {
            open: false
        };
    }

    handleTouchTap(event){
        event.preventDefault();
        this.setState({
            open: true,
            anchorEl: event.currentTarget,
        });
    }

    render(){
        let { open, anchorEl } = this.state;
        let { currentUser, selectTranslate, selectVerify, EditBill, RemoveBill, handleOpen, data } = this.props;
        return (<div style={{width: '100%'}}>
            {currentUser.profile.name==='editor'?
                <button class="btn" style={{borderWidth: 0, width: 48, padding: '3px 6px'}} onClick={()=>selectVerify(data)}>Verify</button>
            :
            <button class="btn" style={{borderWidth: 0, width: 48, padding: '3px 6px'}} onClick={()=>selectTranslate(data)}>Select</button>
            }
            <button class="btn" style={{borderWidth: 0, borderLeftWidth: 1, width: 24, padding: '3px 6px'}} onClick={this.handleTouchTap.bind(this)}><span class="fa fa-ellipsis-v" aria-hidden="true"></span></button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                targetOrigin={{horizontal: 'middle', vertical: 'top'}}
                onRequestClose={()=>this.setState({open: false})}>
                <MenuItem onClick={()=>RemoveBill(data)} primaryText="Cancel" style={styles.item} />
            </Popover>
        </div>);
    }
}
const styles = {
    list: {
        listStyle: 'none',
        margin: 0,
        padding: '5px 0'
    },
    item: {lineHeight: '26px', minHeight: 26, fontSize: 12},
    divider:{
        backgroundColor: '#ededed',
        margin: '4px 1px',
        height: 1
    }
};
