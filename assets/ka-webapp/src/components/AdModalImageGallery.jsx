/* eslint-disable react/prop-types */
/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import {
  Image, Card,
} from 'semantic-ui-react';

class AdModalImageGallery extends Component {
  render() {
    const { imgUrls } = this.props;
    const imgListCards = Object.values(imgUrls).map(img => (
      <Card key={img.id}>
        <Image src={img.url} size="medium" wrapped />
      </Card>
    ));

    return (
      <Card.Group>
        {imgListCards}
      </Card.Group>
    );
  }
}

export default AdModalImageGallery;
