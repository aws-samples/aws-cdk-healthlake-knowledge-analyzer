/* eslint-disable react/prop-types */
import React from 'react';
import { Segment } from 'semantic-ui-react';
import { connect } from 'react-redux';

import GraphStatsContainer from './GraphStatsContainer';
import AdsListComponent from './AdsListComponent';

const AdFeedArea = ({ linkClicked }) => (
  <div className="adfeed">
    <Segment style={{
      overflow: 'auto',
      maxHeight: '95vh',
      padding: '0em',
      background: '#e3e5e8',
    }}
    >
      <GraphStatsContainer />
      {linkClicked != null && <AdsListComponent highlight />}
      <AdsListComponent />
    </Segment>
  </div>
);

function mapStateToProps(state) {
  return {
    linkClicked: state.clicked_link,
  };
}

export default connect(mapStateToProps)(AdFeedArea);
