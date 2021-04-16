/* eslint-disable react/prop-types */
import React from 'react';
import {
  Label, Icon, Image, Grid, Segment, Header,
} from 'semantic-ui-react';

import { AD_HIGHLIGHT_COLOR } from '../store/utility';
// ***************************************************
// *************** Display one ad Post ***************
// ***************************************************

function KendraAnswer({
  ansId, ansType, documentTitle, documentId, documentExcerpt, documentName, onAnswerClick, onFileClick, highLightAnswer,
}) {
  const segmentStyle = {
    padding: '0.5em',
    backgroundColor: highLightAnswer ? AD_HIGHLIGHT_COLOR : "white",
    // backgroundColor: "white",
    border: "none"
    // color: "black"
  };

  const headerStyle = {
    border: 0,
    margin: '-0.25em 0em -0.25em 0em',
    // background: highLightAnswer ? "4B4f69" : "#F5F5F6",
    // background: "4B4f69",
    // color: '#0F7CC6',
    color: '#64AEE8',
    cursor: 'pointer',
  };

  const suggestedAnswer = (ansType === "ANSWER") ?
      <Label color='grey' title="a" ribbon>
        <Icon name="star outline" />
        <Label.Detail>Kendra Suggested Answer</Label.Detail>
        {/* {adId.substr(0, 50).trim()} */}
      </Label>
    : null

  return (
    <Grid.Row style={{ paddingBottom: '1.5em' }}>
      <Header
        block
        style={headerStyle}
        onClick={onAnswerClick}
      >
        {suggestedAnswer}        
        {documentTitle}
        {/* <div dangerouslySetInnerHTML={{ __html: documentTitle }} /> */}
      </Header>
      <Segment attached secondary style={segmentStyle}>

        {/* Display file name */}
        <Label onClick={onFileClick} as="a" basic color="blue" style={{ border: "none" }}>
          <Icon name="file alternate outline" />
          &nbsp;&nbsp;
          {`${documentName.substr(0, 80).trim()}`}
        </Label>

        {/* Display document excerpt */}
        <div dangerouslySetInnerHTML={{ __html: documentExcerpt }} />        

      </Segment>
      {/* <Item.Image size='tiny' src='/images/wireframe/image.png' /> */}
    </Grid.Row>
  );
}


export default KendraAnswer;
