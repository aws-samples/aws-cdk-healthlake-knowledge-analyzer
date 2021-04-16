/* eslint-disable react/prop-types */
import React from 'react';
import {
  Grid,
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import KendraAnswer from './KendraAnswer';
// import AdDisplayModal from './AdDisplayModal';

import * as actionCreators from '../store/actions/globalActions';

// ***************************************************
// ************ Display List of AD Posts *************
// ***************************************************
class AnswersListComponent extends React.Component {
  handleAnswerClick = (ans) => {
    // const { adModalToggle, handleKendraAnswerClick } = this.props;
    // console.log(ad);
    // handleKendraAnswerClick(!adModalToggle, ad);

    const logMsg = {
      date: new Date().toLocaleString(),
      // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
      icon: 'expand',
      summary: `Clicked on answer from file "${ans["DocumentTitle"]}"`,
    };

    this.logToFeed(logMsg);
  };

  handleFileClick = (ans) => {
    const { handleKendraAnswerClick } = this.props;
    // console.log(ad);
    handleKendraAnswerClick(ans["DocumentName"]);

    const logMsg = {
      date: new Date().toLocaleString(),
      // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
      icon: 'searchengin',
      summary: `Browsing Graph with File: "${ans["DocumentName"]}"`,
    };

    this.logToFeed(logMsg);  };  

  logToFeed = (logMsg) => {
    const {
      logActionToFeed,
    } = this.props;

    // Log Action to Feed
    logActionToFeed(logMsg);
  };

  render() {
    const { kendraResults, clicked_ent, ent_to_file_map } = this.props;

    // Create a list of KendraAnswer components if adsList is populated
    const AnswersList = ("ResultItems" in kendraResults && Object.keys(kendraResults["ResultItems"]).length !== 0)
      ? (
        Object.values(kendraResults["ResultItems"].slice(0, 100)).map((ans) => {

          var highLightAnswer = false 

          if (clicked_ent) {
            console.log("CLICKED ENT: ", clicked_ent)
            const files = ent_to_file_map[clicked_ent]

            console.log("AFFECTED FILES: ", ent_to_file_map[clicked_ent])
            console.log("AFFECTED FILES RET: ", files)

            console.log("CURRENT DOC: ", ans["DocumentName"].toLowerCase())

            if (files.indexOf(ans["DocumentName"].toLowerCase()) >=0 ) {
              highLightAnswer = true
            }
          }
          
          return (
              <KendraAnswer
                  key={ans['Id']}
                  ansId={ans['Id']}
                  ansType={ans['Type']}
                  documentTitle={ans['DocumentTitle']}
                  documentId={ans['DocumentId']}
                  documentExcerpt={ans['DocumentExcerpt']}
                  documentName={ans["DocumentName"]}
                  onAnswerClick={() => this.handleAnswerClick(ans)}
                  onFileClick={() => this.handleFileClick(ans)}
                  highLightAnswer={highLightAnswer}
              />
          );
        })
      ) : null;

    // Return
    return (
      <Grid padded divided>
        <Grid.Column>
          {AnswersList}
        </Grid.Column>
        {/* <AdDisplayModal /> */}
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  return {
    kendraResults: state.kendra_results,
    clicked_ent: state.clicked_ent,
    ent_to_file_map: state.ent_to_file_map
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleKendraAnswerClick: (ansDocName) => dispatch(actionCreators.initiateFetchDocNeighbors([ansDocName])),
    logActionToFeed: newEvent => dispatch(actionCreators.logActionToFeed(newEvent)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AnswersListComponent);
