import { h, Component } from 'preact';

import SSOPackage from 'asset/ssoLogin';
import logo from 'asset/images/logo.png';

import AppBar from 'material-ui/AppBar';
import Icon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';

export default class SideBar extends Component{
    constructor(props){
        super(props);
    }
    toggleNotification(){

    }
    toggleChatPanel(){

    }
    handleTouchTap(){

    }
    loginCommand(){
        SSOPackage.login();
    }
    logoutCommand(){
        this.props.loginCommand(null);
        SSOPackage.logout();
    }
    render(){
        let {currentUser} = this.props;
        let menuRendered = [
            {displayName: 'Translate', state: '/translate',children: []}
        ];
        const info = {
            appName: 'Web application',
            companyName: 'DHS',
            palette: '#030303',
        };
        const i18n = {
            language: 'vi'
        };
        return (
            <div style={{width: 75, backgroundColor: '#303b47', height: window.innerHeight, display: 'flex', flexDirection: "column"}}>
                <div style={{flex: 1, textAlign: 'center'}}>
                    <img src={logo} width="75" />
                </div>
                <div style={{flex: 0, textAlign: 'center', marginBottom: 10}}>
                    {currentUser?
                        <IconMenu
                            iconButtonElement={ <IconButton touch={true} tooltip={currentUser.username} tooltipPosition="top-center" iconStyle={{color:'white'}}><Icon class="fa fa-user-circle" /></IconButton> }
                            targetOrigin={{horizontal: 'right', vertical: 'top'}}
                            anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                        >
                            <MenuItem primaryText="Sign out" onClick={()=>this.logoutCommand()} />
                        </IconMenu>
                    :<IconButton onClick={this.loginCommand.bind(this)} touch={true} tooltip="Login" tooltipPosition="top-center" iconStyle={{color:'white'}}><Icon class="fa fa-sign-in" /></IconButton>}
                    {/* <Icon style={{color: 'white', fontSize: 36, width: 32, height: 32 }} class="" /> */}
                </div>
            </div>
        );
    }
}
