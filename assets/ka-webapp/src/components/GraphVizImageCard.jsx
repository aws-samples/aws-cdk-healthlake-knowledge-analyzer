/* eslint-disable react/prop-types */
import React from 'react';
import { Card, Image } from 'semantic-ui-react';
import { connect } from 'react-redux';

// import * as actionCreators from '../store/actions/globalActions';


const GraphVizImageCard = ({ clickedImage, imgUrls }) => {
  let ImgCard = null;

  if (clickedImage && clickedImage.label === 'IMAGE' && Object.keys(imgUrls).length > 0) {

    const imgUrl = imgUrls[parseInt(clickedImage.id, 10)].url || 'https://react.semantic-ui.com/images/avatar/large/matthew.png';
    // const imgUrl = 'https://react.semantic-ui.com/images/avatar/large/matthew.png';

    ImgCard = (
      <Card>
        <Image src={imgUrl} size="small" wrapped ui={false} />
        <div style={{ color: 'black' }}>
          <h3>
            {' '}
            { clickedImage.id }
            {' '}
          </h3>
        </div>
      </Card>
    );
  }

  return (
    <div>
      { ImgCard }
    </div>
  );
};

function mapStateToProps(state) {
  return {
    clickedImage: state.clicked_node,
    imgUrls: state.img_urls_data,
  };
}

export default connect(mapStateToProps)(GraphVizImageCard);
