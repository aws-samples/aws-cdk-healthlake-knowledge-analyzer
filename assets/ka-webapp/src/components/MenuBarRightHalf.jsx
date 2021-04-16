/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Dropdown, Menu, Input, Icon, Button,
} from 'semantic-ui-react';

import * as actionCreators from '../store/actions/globalActions';

class MenuBarRightHalf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
    };
    this.handlePhoneSearch = this.handlePhoneSearch.bind(this);
    this.clearAll = this.clearAll.bind(this);
  }

  handlePhoneSearch(e) {
    e.preventDefault();
    const { searchQuery } = this.state;
    const { onSearchClick } = this.props;

    onSearchClick(searchQuery);
  }

  clearAll(e) {
    e.preventDefault();
    const { clearAllAndResetState, logActionToFeed } = this.props;
    this.setState({ searchQuery: '' });
    // Log Action to Feed
    logActionToFeed({
      date: new Date().toLocaleString(),
      // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
      summary: 'KG: Clear All Data and Reset',
      icon: 'remove circle',
    });

    clearAllAndResetState();
  }

  render() {
    const { searchQuery } = this.state;
    const { trailDegrees } = this.props;
    const trailDegreeOptions = [
      { key: 1, value: 1, text: '1 Degrees Out' },
      { key: 2, value: 2, text: '2 Degrees Out' },
      { key: 3, value: 3, text: '3 Degrees Out' },
      { key: 4, value: 4, text: '4 Degrees Out' },
    ];
    return (
      <Menu.Menu position="left">

        <Menu.Item>
          <Input
            action={{ color: 'olive', content: 'Search', onClick: (e) => { this.handlePhoneSearch(e); } }}
            icon="search"
            iconPosition="left"
            placeholder="Search Patient Visit Notes ... "
            onChange={e => this.setState({ searchQuery: e.target.value })}
            onKeyPress={e => ((e.key === 'Enter') ? this.handlePhoneSearch(e) : null)}
            value={searchQuery}
            style={{ width: '700px' }}
          />
        </Menu.Item>

        <Menu.Item>
          <Button icon onClick={this.clearAll}>
            <Icon name="delete" />
            &nbsp;
            Clear All
          </Button>
        </Menu.Item>

        {/* <Dropdown item text="Options" color="blue">
          <Dropdown.Menu>
            <Dropdown.Item>
              ...
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown> */}

      </Menu.Menu>
    );
  }
}

function mapStateToProps(state) {
  return {
    trailDegrees: state.trail_degrees_out,
  };
}

// Maps dispatch to props
function mapDispatchToProps(dispatch) {
  return {
    onSearchClick: searchQuery => dispatch(actionCreators.initiateKendraSearch(searchQuery)),
    clearAllAndResetState: () => dispatch(actionCreators.clearAllAndResetState()),
    logActionToFeed: newEvent => dispatch(actionCreators.logActionToFeed(newEvent)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MenuBarRightHalf);
