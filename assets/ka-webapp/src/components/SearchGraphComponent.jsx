import React from 'react';
import GraphinVizArea from './GraphinVizArea';
import ActionsFeedArea from './ActionsFeedArea';
import KendraAnswersArea from './KendraAnswersArea';

const SearchGraphComponent = () => (
  <React.Fragment>
    {/* AD Feed Area */}
    <KendraAnswersArea />

    {/* Graph Visualization Area */}
    <GraphinVizArea />

    {/* Actions Feed Area */}
    <ActionsFeedArea />

  </React.Fragment>
);

export default SearchGraphComponent;
