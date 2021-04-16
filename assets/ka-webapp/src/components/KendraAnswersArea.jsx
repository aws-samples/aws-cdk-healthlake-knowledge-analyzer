/* eslint-disable react/prop-types */
import React from 'react';
import { Segment } from 'semantic-ui-react';
import { connect } from 'react-redux';

import GraphStatsContainer from './GraphStatsContainer';
import AnswersListComponent from './AnswersListComponent';

const KendraAnswersArea = ({ linkClicked }) => (
  <div className="adfeed">
    <Segment basic style={{
      // overflow: 'auto',
      // maxHeight: '95vh',
      margin: '5px 0 0 0',
      // background: '#e3e5e8',
    }}
    >
      <GraphStatsContainer />
      {/* {linkClicked != null && <AdsListComponent highlight />} */}
      <AnswersListComponent />
    </Segment>
  </div>
);

function mapStateToProps(state) {
  return {
    linkClicked: state.clicked_link,
  };
}

export default connect(mapStateToProps)(KendraAnswersArea);
