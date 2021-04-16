/* eslint-disable react/prop-types */
import React from 'react';
import {
  Container, Button,
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import {capitalize} from 'lodash';
import * as actionCreators from '../store/actions/globalActions';
import * as utility from '../store/utility';
import GraphVizImageCard from './GraphVizImageCard';


const GraphVizControls = ({
  expandGraphActive, expandGraphToggle, dataFetchInProgress, 
  handleClearGraphData, regraph_layout_list, current_regraph_layout,
  refreshGraph,
}) => {
  const expandInProgress = (dataFetchInProgress === utility.EXPAND_GRAPH_IN_PROGRESS);

  const expandButton = (expandInProgress)
    ? (
      <Button
        compact
        icon="expand arrows alternate"
        loading
        primary
        content="Expand Graph"
      />
    ) : (
      <Button
        compact
        icon="expand arrows alternate"
        color={expandGraphActive ? 'blue' : null}
        active={expandGraphActive}
        onClick={() => expandGraphToggle(!expandGraphActive)}
        content="Browse Graph"
      />
    );


  return (
    <div
      style={{
        position: 'absolute',
        height: 'inherit',
        width: 'inherit',
      }}
    >
      {/* Top level Controls  */}
      <Container
        style={{
          position: 'absolute',
          zIndex: 2,
          width: '100%',
        }}
      >
        <Button
          compact
          icon="remove"
          // color="blue"
          onClick={() => handleClearGraphData()}
          content="Clear Graph"
        />
        <Button
          compact
          icon="refresh"
          // color="blue"
          onClick={() => refreshGraph(regraph_layout_list[(regraph_layout_list.indexOf(current_regraph_layout)+1)%regraph_layout_list.length])}
          content = {capitalize(current_regraph_layout)}
        />
        {/* <Button
          compact
          icon="refresh"
          color="blue"
          onClick={() => graphVizRef.refresh()}
          // color={graph3DActive ? 'blue' : null}
        /> */}
        {/* <Button
          compact
          icon="cube"
          active={graph3DActive}
          onClick={() => graph3DToggle(!graph3DActive)}
          color={graph3DActive ? 'blue' : null}
          content="3D"
        /> */}
        {/* {expandButton} */}
      </Container>

      {/* Scroll of clicked nodes' details */}
      <div style={{
        position: 'absolute',
        marginLeft: '5px',
        marginBottom: '5px',
        bottom: 0,
        zIndex: 2,
      }}
      >
        <GraphVizImageCard />
      </div>
    </div>
  );
};

function mapStateToProps(state) {
  return {
    expandGraphActive: state.expand_graph_checked,
    dataFetchInProgress: state.data_fetch_in_progress,
    graph3DActive: state.graph_3d,
    graphVizRef: state.graph_component_ref,
    current_regraph_layout: state.current_regraph_layout,
    regraph_layout_list: state.regraph_layout_list,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleClearGraphData: () =>  dispatch(actionCreators.clearGraphData()),
    expandGraphToggle: expandGraphToggle => dispatch(actionCreators.toggleExpandGraph(expandGraphToggle)),
    refreshGraph: newLayout => dispatch(actionCreators.refreshGraph(newLayout)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphVizControls);
