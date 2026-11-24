import { h, Component } from 'preact';
// import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Async from './Async';
import SSOPackage from 'asset/ssoLogin';
import 'asset/styles/material.css';
import 'asset/styles/app.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Subheader from 'material-ui/Subheader';
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();

import { Connect } from "redux-zero/preact";
import actions from 'asset/actions';

class App extends Component {
	constructor(props){
		super(props);
		SSOPackage.checkAuth(props.loginCommand);
	}
	render() {
		return (
			<MuiThemeProvider>
				<div style={{display: 'flex'}}>
					<Async load={import('./sideBar')} {...this.props} />
					<div style={{width: window.innerWidth - 75}}>
						<Async load={import('./navigation')} {...this.props} />
						{this.props.currentUser?
							<Async load={import('./translate')} {...this.props} />
						:
						<Subheader>Login Required!</Subheader>
						}
					</div>
				</div>
			</MuiThemeProvider>
		);
	}
}
{/* <Router>
	<div>
		<Async load={import('./navigation')} {...this.props} />
		<PrivateRoute {...this.props} exact path="/" render={props=><Home {...this.props} {...props} />} />
		<PrivateRoute {...this.props} path="/translate" render={props => <Async load={import('./translate')} {...this.props} {...props} /> } />
	</div>
</Router> */}
// const Home = (props) => (
//   <div>
// 	  <h2>Home</h2>
// 	  <div>
// 		  <h1>{props.count}</h1>
// 		  <div>
// 			  <button onClick={()=>props.decrement(5)}>decrement</button>
// 			  <button onClick={()=>props.increment(5)}>increment</button>
// 			  <button onClick={()=>props.loginCommand({id: 0})}>login TEst</button>
// 			  <button onClick={()=>console.log(props)}>View</button>
// 		  </div>
//       </div>
//   </div>
// );

// const PrivateRoute = ({ component: Component, ...rest }) => (
//   <Route
// 	  {...rest}
// 	  render={props => rest.currentUser ?  rest.render(props) : (
// 		  <h5 style={{width: '100%', textAlign: 'center'}}>Please Login!</h5>
// 	  )
// 	  }
//   />
// );
export default () => (
  <Connect mapToProps={({ count, currentUser }) => ({ count, currentUser })} actions={actions}>
	  {(props) => (
		  <App {...props} />
	  )}
  </Connect>
);
//window.opener pass value to parent
