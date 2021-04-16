import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, Icon, Image,
} from 'semantic-ui-react';

import { connect } from 'react-redux';

import MenuBarRightHalf from './MenuBarRightHalf';

import * as actionCreators from '../store/actions/globalActions';

// SVG or Logos
import logo from '../imgs/logo.png';
// import logocmc from '../logo.png';



const TopMenuBar = ({ sidebarVisible, toggleSidebarVisibility, kendra_search_view }) => (
  <Menu 
    fixed="top" 
    size="tiny" 
    style={{ 
      backgroundColor: "white",
      boxShadow: "-16px -8px 11px 2px"
    }} 
    inverted borderless
  >
    <Menu.Item as="a" onClick={() => toggleSidebarVisibility(!sidebarVisible)}>
      <Icon name="sliders" size="large" color={sidebarVisible ? 'green' : 'grey'} />
    </Menu.Item>
    <Menu.Item>
      <Image
        src={logo}
        style={{
          height: '30px',
          width: '30px',
          // height: '32px',
          // width: '235px',
          marginRight: '3.5em',
        }}
      />
    </Menu.Item>

    <Menu.Item style={{ color: '#BE2BBB', letterSpacing: '1.5px', fontWeight: "bold" }}>
        { kendra_search_view && "Knowledge Repository - Search"}
    </Menu.Item>

    {/* Top Menu Bar Right Half */}
    { kendra_search_view && <MenuBarRightHalf /> }
    
  </Menu>
);

function mapStateToProps(state) {
  return {
    sidebarVisible: state.sidebar_visible,
    kendra_search_view: state.kendra_search_view,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleSidebarVisibility: visibleNew => dispatch(actionCreators.toggleSidebarVisibility(visibleNew)),
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(TopMenuBar);
