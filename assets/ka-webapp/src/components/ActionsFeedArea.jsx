/* eslint-disable react/prop-types */
import React from 'react';
import { Feed } from 'semantic-ui-react';
import { connect } from 'react-redux';

const ActionsFeedArea = ({ actionFeed }) => (
  <div className="actionsFeedArea">
    <Feed events={actionFeed} />
  </div>
);

function mapStateToProps(state) {
  return {
    actionFeed: state.action_feed_events,
  };
}

export default connect(mapStateToProps)(ActionsFeedArea);
