/* eslint-disable camelcase */
/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import {
  Modal, Label, Icon, Segment,
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import AdModalImageGallery from './AdModalImageGallery';

import * as actionCreators from '../store/actions/globalActions';

class AdDisplayModal extends Component {
  handleOpen = () => this.setState({ modalOpen: true })

  handleClose = () => this.setState({ modalOpen: false })

  render() {
    const {
      adModalToggle, adModalAdId, closeAdModal, adsDescMap, imgUrlsMap, adIdList, handleModalNavigate,
    } = this.props;

    let images;
    let imgUrls;
    let title;
    let locations;
    let date_updated;
    let age;
    let currAdIdx;
    let adNumStr;
    let prevAdId;
    let nextAdId;

    if (adModalToggle) {
      // Get all the attributes of current AD:
      ({
        images, title, locations, date_updated, age,
      } = adsDescMap[adModalAdId]);

      // Get list of urls for every image in current AD
      imgUrls = images.reduce((res, i) => {
        if (parseInt(i, 10) in imgUrlsMap) {
          res.push({
            url: imgUrlsMap[parseInt(i, 10)].url,
            id: i,
          });
        }
        return res;
      }, []);

      // Get the next and prev ad-id for current ad
      currAdIdx = adIdList.indexOf(adModalAdId);
      console.log(`Current Modal AD's Idx: ${currAdIdx}`);

      if (currAdIdx !== -1) {

        // for (i=currAdIdx;)
        nextAdId = (currAdIdx < adIdList.length - 1) ? adIdList[currAdIdx + 1] : null;
        prevAdId = (currAdIdx > 0) ? adIdList[currAdIdx - 1] : null;
        adNumStr = `Ad Num: ${currAdIdx + 1}/${adIdList.length}`;
      }
    }

    return (
      adModalToggle
        ? (
          <Modal
            open={adModalToggle}
            onClose={() => closeAdModal()}
            // centered={false}
          >
            <Modal.Header style={{ background: '#4a4f69', color: 'white' }}>
              <Label color="grey" title="Ad ID" ribbon>
                <Label.Detail>
                  {adNumStr}
                  &nbsp; &nbsp; &nbsp; &nbsp;Post ID:&nbsp; &nbsp;
                </Label.Detail>
                {adModalAdId.substr(0, 50).trim()}
              </Label>
              &nbsp;&nbsp;
              {title}
            </Modal.Header>

            <Modal.Content scrolling>
              <Icon
                className="ModalLeftNavigate"
                name="angle left"
                // style={LeftIconStyle}
                size="huge"
                disabled={prevAdId == null}
                onClick={() => handleModalNavigate(true, prevAdId)}
              />
              <Icon
                className="ModalRightNavigate"
                name="angle right"
                size="huge"
                disabled={nextAdId == null}
                onClick={() => handleModalNavigate(true, nextAdId)}
              />
              <Modal.Description>

                <Segment basic>
                  {/* Labesl */}
                  <Label color="teal" title="Location Posted">
                    <Icon name="map marker alternate" />
                    &nbsp;&nbsp;
                    {locations}
                  </Label>
                  <Label color="teal" title="Date Posted">
                    <Icon name="calendar alternate outline" />
                    &nbsp;&nbsp;
                    {date_updated}
                  </Label>
                  <Label color="teal" title="Age">
                    <Icon name="user outline" />
                    &nbsp;&nbsp;
                    {age}
                  </Label>

                  {/* ad body */}
                  <br />
                  <div dangerouslySetInnerHTML={{ __html: adsDescMap[adModalAdId].body.trim() }} />

                  <AdModalImageGallery imgUrls={imgUrls} />
                </Segment>

              </Modal.Description>
            </Modal.Content>
          </Modal>
        ) : null
    );
  }
}

function mapStateToProps(state) {
  return {
    adModalToggle: state.display_ad_modal_toggle,
    adModalAdId: state.ad_modal_ad_id,
    adsDescMap: state.ads_desc_data,
    imgUrlsMap: state.img_urls_data,
    adIdList: state.ad_id_list,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    closeAdModal: () => dispatch(actionCreators.toggleDisplayAdModal(false, null)),
    handleModalNavigate: (displayAdModalToggleNew, adId) => dispatch(actionCreators.toggleDisplayAdModal(displayAdModalToggleNew, adId)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AdDisplayModal);
