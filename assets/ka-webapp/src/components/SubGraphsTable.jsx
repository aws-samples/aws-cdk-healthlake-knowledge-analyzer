/* eslint-disable react/prop-types */
/* eslint-disable camelcase */
import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Table, Label } from 'semantic-ui-react';

import * as actionCreators from '../store/actions/globalActions';

// Phone Labels component
const PhIdsLabels = ({ phIds, onPhoneClick }) => {
  const listItems = phIds.map(i => (
    <Link
      key={i}
      to="/"
      onClick={() => onPhoneClick(i)}
    >
      <Label
        basic
        key={i}
        size="small"
        color="teal"
      >
        {i}
      </Label>
    </Link>
  ));

  return listItems;
};

// Table component
class SubGraphsTable extends Component {
  constructor(props) {
    super(props);

    const { tableData } = props;

    this.state = {
      column: null,
      data: tableData,
      direction: null,
    };
  }


  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state;

    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: 'ascending',
      });

      return;
    }

    this.setState({
      data: data.reverse(),
      direction: direction === 'ascending' ? 'descending' : 'ascending',
    });
  }

  render() {
    const { column, data, direction } = this.state;
    const { onPhoneClick } = this.props;

    return (
      <Table sortable celled>
        <Table.Header>
          <Table.Row textAlign="center">
            <Table.HeaderCell
              sorted={column === 'grp_id' ? direction : null}
              onClick={this.handleSort('grp_id')}
            >
              Group ID
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'num_imgs' ? direction : null}
              onClick={this.handleSort('num_imgs')}
            >
              Num Images
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'num_phones' ? direction : null}
              onClick={this.handleSort('num_phones')}
            >
              Num Phones
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'total_nodes' ? direction : null}
              onClick={this.handleSort('total_nodes')}
            >
              Total Num Nodes
            </Table.HeaderCell>
            <Table.HeaderCell>
              Phone Numbers
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'suspect_score' ? direction : null}
              onClick={this.handleSort('suspect_score')}
            >
              Suspect Score
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {_.map(data, ({
            grp_id, num_imgs, num_phones, total_nodes, ph_numbers, suspect_score, highlight,
          }) => (
            <Table.Row key={grp_id} negative={highlight}>
              <Table.Cell textAlign="center">{grp_id}</Table.Cell>
              <Table.Cell textAlign="center">{num_imgs}</Table.Cell>
              <Table.Cell textAlign="center">{num_phones}</Table.Cell>
              <Table.Cell textAlign="center">{total_nodes}</Table.Cell>
              {/* <Table.Cell>
                <PhIdsLabels phIds={ph_ids} />
              </Table.Cell> */}
              <Table.Cell>
                <PhIdsLabels phIds={ph_numbers} onPhoneClick={onPhoneClick} />
                {/* {ph_numbers} */}
              </Table.Cell>
              <Table.Cell textAlign="center">{suspect_score}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }
}

function mapStateToProps(state) {
  return {
    tableData: state.sub_graphs_table_data,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onPhoneClick: phoneSearchText => dispatch(actionCreators.initiateGetGraphData(phoneSearchText)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SubGraphsTable);
