/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
import { Container, Header } from 'semantic-ui-react';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

function GraphStatsContainer({
  kendraNumResults, graph_viz_data, links, clickedLink, linkToAdsMap,
}) {
  // const statsString = `Graph Size: ${nodes} nodes and ${links} edges. Num of Entity Inovled:${numAnswers}${plusSign}`;
  var selectedStatsString = (kendraNumResults) 
    ? `1 to 15 of ${kendraNumResults} results.` 
    : "";

  // selectedStatsString += `Number of Graph nodes:${Object.keys(graph_viz_data).length}`

  return (
    <Container textAlign="center" border="false">
      {/* <Header block size="large"> */}
        <b>Amazon Kendra results</b>:
        <p style={{ fontSize: 'small', fontWeight: 'normal', color: 'teal' }}>{selectedStatsString}</p>
        {/* {selectionStats} */}
      {/* </Header> */}
    </Container>
  );
}

function mapStateToProps(state) {
  return {
    kendraNumResults: state.kendra_num_results,
    graph_viz_data: state.graph_viz_data,
    // ads: state.ad_id_list,
    nodes: state.node_id_list.length,
    links: state.link_id_list.length,
    clickedLink: state.clicked_link,
    linkToAdsMap: state.ads_to_links_map,
  };
}

export default connect(mapStateToProps)(GraphStatsContainer);
