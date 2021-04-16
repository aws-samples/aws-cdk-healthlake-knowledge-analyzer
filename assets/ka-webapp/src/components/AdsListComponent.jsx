/* eslint-disable react/prop-types */
import React from 'react';
import {
  Grid,
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import AdDetail from './AdDetail';
import AdDisplayModal from './AdDisplayModal';

import * as actionCreators from '../store/actions/globalActions';

// ***************************************************
// ************ Display List of AD Posts *************
// ***************************************************
class AdsListComponent extends React.Component {
  handleAdClick = (ad) => {
    const { adModalToggle, handleAdDetailClick } = this.props;
    // console.log(ad);
    handleAdDetailClick(!adModalToggle, ad);
    this.logNodeClicktoFeed(ad);
  };

  logNodeClicktoFeed = (ad) => {
    const {
      logActionToFeed,
    } = this.props;

    const logMsg = {
      date: new Date().toLocaleString(),
      // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
      icon: 'expand',
      summary: `Ad Detail Launched: AdId - ${ad}`,
    };

    // Log Action to Feed
    logActionToFeed(logMsg);
  };

  render() {
    const {
      adsList, imgUrls, clickedLink, linkToAdsMap, highlight, adIdList,
    } = this.props;

    // Create a list of AdDetail components if adsList is populated
    const AdsList = (Object.keys(adsList).length !== 0)
      ? (
        Object.values(adIdList.slice(0, 100)).map((ad) => {
          let imgId;
          try {
            imgId = adsList[ad].images[0];
          } catch (e) {
            return null;
          }

          let adImgURL = 'http://semantic-ui.com/images/wireframe/image.png';
          let highlightAd = false;

          if (imgId in imgUrls) {
            adImgURL = imgUrls[imgId].url;
          }

          // Check if clicked link is connected to current ad
          try {
            const adsSelected = linkToAdsMap.links[clickedLink.id];
            if (adsSelected.indexOf(ad) > -1) {
              highlightAd = true;
              console.log('[Info] AD Highlighted: ', adsSelected);
            }
          } catch (e) {
            // console.log('Clicked link has no corresponding Ads. This shouldn\'t be happening - ERROR');
          }

          // Display ad detail for regular and highlighted ads combination
          if ((highlight && highlightAd) || (!highlight && !highlightAd)) {
            return (
              <AdDetail
                key={ad}
                adId={ad}
                adHeader={`${adsList[ad].title.substr(0, 35).trim()}.... `}
                adBody={`${adsList[ad].body.substr(0, 300).trim()}.... `}
                adPosted={adsList[ad].date_updated}
                adLocation={adsList[ad].locations}
                adAge={adsList[ad].age}
                adImgURL={adImgURL}
                highlightAd={highlightAd}
                onAdClick={() => this.handleAdClick(ad)}
              />
            );
          }
          return null;
        })
      ) : null;

    // Return
    return (
      <Grid padded divided>
        <Grid.Column>
          {AdsList}
        </Grid.Column>
        <AdDisplayModal />
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  return {
    adsList: state.ads_desc_data,
    imgUrls: state.img_urls_data,
    clickedLink: state.clicked_link,
    linkToAdsMap: state.ads_to_links_map,
    adModalToggle: state.display_ad_modal_toggle,
    adIdList: state.ad_id_list,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleAdDetailClick: (displayAdModalToggleNew, adId) => dispatch(actionCreators.toggleDisplayAdModal(displayAdModalToggleNew, adId)),
    logActionToFeed: newEvent => dispatch(actionCreators.logActionToFeed(newEvent)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AdsListComponent);
