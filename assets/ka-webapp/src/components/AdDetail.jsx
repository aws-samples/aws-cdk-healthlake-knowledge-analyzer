/* eslint-disable react/prop-types */
import React from 'react';
import {
  Label, Icon, Image, Grid, Segment, Header,
} from 'semantic-ui-react';

import { AD_HIGHLIGHT_COLOR } from '../store/utility';
// ***************************************************
// *************** Display one ad Post ***************
// ***************************************************

function AdDetail({
  adId, adHeader, adBody, adPosted, adLocation, adAge, adImgURL, highlightAd, onAdClick,
}) {
  const segmentStyle = {
    padding: '0.5em',
    backgroundColor: highlightAd ? AD_HIGHLIGHT_COLOR : null,
  };

  const headerStyle = {
    border: 0,
    margin: '0em 0em -0.25em 0em',
    background: '#4B4f69',
    color: 'white',
    cursor: 'pointer',
  };

  return (
    <Grid.Row style={{ paddingBottom: '1.5em' }}>
      <Header
        block
        style={headerStyle}
        onClick={onAdClick}
      >
        <Label color={highlightAd ? 'blue' : 'grey'} title="Ad ID" ribbon>
          {/* <Icon name="sticky note outline" /> */}
          <Label.Detail>Post ID:&nbsp; &nbsp;</Label.Detail>
          {adId.substr(0, 50).trim()}
        </Label>
        &nbsp;&nbsp;
        {adHeader}
      </Header>
      <Segment attached secondary style={segmentStyle}>
        <Label color="teal" title="Location Posted">
          <Icon name="map marker alternate" />
          &nbsp;&nbsp;
          {adLocation}
        </Label>
        <Label color="teal" title="Date Posted">
          <Icon name="calendar alternate outline" />
          &nbsp;&nbsp;
          {adPosted}
        </Label>
        <Label color="teal" title="Age">
          <Icon name="user outline" />
          &nbsp;&nbsp;
          {adAge}
        </Label>
        <Image src={adImgURL} size="tiny" floated="right" />
        <div dangerouslySetInnerHTML={{ __html: adBody }} />
      </Segment>
      {/* <Item.Image size='tiny' src='/images/wireframe/image.png' /> */}
    </Grid.Row>
  );
}


export default AdDetail;
