import { h, Component } from 'preact';
import SSOPackage from 'asset/ssoLogin';
import { NavLink } from "react-router-dom";

import AppBar from 'material-ui/AppBar';
import Icon from 'material-ui/FontIcon';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';

export default class Navigation extends Component{
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
            <AppBar
                title="DHS Translation"
                showMenuIconButton={false}
                // iconElementRight={currentUser?
                //     <IconMenu
                //         iconButtonElement={ <FlatButton labelStyle={{color:'white'}} label={currentUser.username} icon={<Icon style={{color:'white'}} className="fa fa-user" />} /> }
                //         targetOrigin={{horizontal: 'right', vertical: 'top'}}
                //         anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                //     >
                //         <MenuItem primaryText="Sign out" onClick={()=>this.logoutCommand()} />
                //     </IconMenu>
                // :<FlatButton onClick={this.loginCommand.bind(this)} label="Login" />}
            />
        );
    }
}
