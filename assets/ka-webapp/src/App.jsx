import React from 'react';
import SplitPane from 'react-split-pane';
import {
  BrowserRouter as Router, Route, Switch, Redirect,
} from 'react-router-dom';
import { connect } from 'react-redux';
import {
  Sidebar, Loader, Dimmer,
} from 'semantic-ui-react';

import SearchGraphComponent from './components/SearchGraphComponent';

import TopMenuBar from './components/TopMenuBar';

// Redux action Creators
import * as actionCreators from './store/actions/globalActions';
import * as utility from './store/utility';

// Stylesheets
import 'semantic-ui-css/semantic.min.css';
import './App.css';
import './tree-style.less';

import logo from './logo.svg';
import './App.css';

const App = ({
  dataFetchInProgress, sidebarVisible, toggleSidebarVisibility, searchClicked,
}) => {
  // Get status of data fetch
  const inProgress = (dataFetchInProgress === utility.SEARCH_IN_PROGRESS);

  return (
    <Router>
      <SplitPane split="horizontal" allowResize={false} style={{ display: 'table' }}>
        <div>
          <TopMenuBar />
        </div>

        {/* Main Area */}
        <div style={{ "marginTop": "10px"}}>
          <Dimmer active={inProgress}>
            <Loader size="huge" />
          </Dimmer>

          <Sidebar.Pushable>

            {/* Left Side Bar */}


            {/* Center Dashboard Area */}
            <Sidebar.Pusher dimmed={sidebarVisible} onClick={(e) => { if (sidebarVisible) { e.preventDefault(); toggleSidebarVisibility(false); } }}>
              <div>
                <Switch>
                  <Route exact path="/" component={SearchGraphComponent} />
                  {/* <Route component={SubGraphsExploreComponent} /> */}
                </Switch>
                { searchClicked ? <Redirect push to="/" /> : null }
              </div>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
        </div>
      </SplitPane>
    </Router>
  );
};

function mapStateToProps(state) {
  return {
    dataFetchInProgress: state.data_fetch_in_progress,
    sidebarVisible: state.sidebar_visible,
    searchClicked: state.data_fetch_in_progress === utility.SEARCH_IN_PROGRESS,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleSidebarVisibility: visibleNew => dispatch(actionCreators.toggleSidebarVisibility(visibleNew)),
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(App);
