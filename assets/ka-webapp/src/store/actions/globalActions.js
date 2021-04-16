/* eslint-disable import/prefer-default-export */

import * as actionTypes from './globalActionTypes';
import * as utility from '../utility';
import { initialState } from '../mainReducer';


// *******************************************
// ************* Utility Functions *************
// *******************************************
export const getHeaders = () => {
  const accessToken = localStorage.getItem('graphExpAccessToken');

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    accessToken,
  };
};

// Clear all and set to initial state
export const clearAllAndResetState = () => ({
  type: actionTypes.CLEAR_ALL,
  new_state: {},
});
 
// Clear all and set to initial state
export const clearGraphData = () => ({
  type: actionTypes.CLEAR_GRAPH_DATA,
  new_state: {
    graph_viz_data: {},
  },
});

export const updateNerTags = (new_ent_tags) => ({
  type: actionTypes.UPDATE_NER_TAGS,
  new_state: {
    'ent_tags': new_ent_tags
  }
})

export const updateCurrentNerTag = (new_current_ent_tag) => ({
  type: actionTypes.UPDATE_NER_TAGS,
  new_state: {
    'current_ent_tag': new_current_ent_tag
  }
})

export const updateCurrentDocId = (new_doc_id) => ({
  type: actionTypes.UPDATE_CURRENT_DOCID,
  new_state: {
    'current_documentId': new_doc_id
  }
})

export const addUniqueEntity = (new_ent) => ({
  type: actionTypes.ADD_NEW_ENTITY_FOR_LABEL,
  new_state: {
    new_ent
  }
})
// *******************************************
// ************* API Return *************
// *******************************************

// FAILURE OF FETCH API
export const noResultReceived = msg => ({
  type: actionTypes.NO_RESULT_RECEIVED,
  new_state: {
    search_response: actionTypes.NO_RESULT_RECEIVED,
    graph_viz_data: initialState.graph_viz_data,
    no_data_found: true,
    received_errorMsg: msg !== undefined ? msg : null,
  },
});

// SUCCESS OF KENDRA SEARCH API
export const validResultReceived = receivedJsonData => ({
  type: actionTypes.VALID_RESULT_RECEIVED,
  new_state: {
    search_response: actionTypes.VALID_RESULT_RECEIVED,
    kendra_results: receivedJsonData,
    kendra_num_results: receivedJsonData.TotalNumberOfResults,
    ads_desc_data: {},
    no_data_found: false,
    received_errorMsg: null,
  },
});

// SUCCESS OF GET NEIGHBORS API
export const validGraphDataReceived = (newGraphData) => ({
  type: actionTypes.VALID_GRAPH_DATA_UPDATE_RECEIVED,
  new_state: {
    newGraphData: newGraphData
  },
});

// SUCCESS OF FETCH ENT TO DOC MAPPING API
export const documentTagsReceived = (myJson) => ({
  type: actionTypes.VALID_ENT_DOC_MAPPING_RECEIVED,
  new_state: {
    new_ent_to_file_map: myJson.ent_to_file_map,
    new_file_to_ent_map: myJson.file_to_ent_map,
  },
});

// SUCCESS OF FETCH FILES LIST
export const validFilesListReceived = (myJson) => ({
  type: actionTypes.VALID_FILES_LIST_RECEIVED,
  new_state: {
    files_list_tree_data: myJson
  },
});

export const validpdfDocObjectReceived = (pdfDocObject) => ({
  type: actionTypes.VALID_PDF_DOC_OBJ_RECEIVED,
  new_state: {
    pdf_doc_object: pdfDocObject,
  },
});

export const validEntSearchResultsReceived = (new_ent_search_results) => ({
  type: actionTypes.VALID_ENT_SEARCH_RECEIVED,
  new_state: {
    ent_search_results: new_ent_search_results,
  },
});

export const validFileSearchResultsReceived = (new_File_search_results) => ({
  type: actionTypes.VALID_FILE_SEARCH_RECEIVED,
  new_state: {
    file_search_results: new_File_search_results,
  },
});

// *******************************************
// ************* FETCH STATE func ************
// *******************************************

// DATA FETCH BEGINS
export const beginDataFetch = inProgress => ({
  type: actionTypes.BEGIN_DATA_FETCH,
  new_state: {
    data_fetch_in_progress: inProgress,
  },
});

export const toggleCompParaFetch = (newStatus) => ({
  type: actionTypes.TOGGLE_COMP_PARA_FETCH,
  new_state: {
    comp_para_fetch_in_progress: newStatus,
  },
})

export const toggleEntSearch = (newStatus) => ({
  type: actionTypes.TOGGLE_COMP_PARA_FETCH,
  new_state: {
    is_ent_search_loading: newStatus,
  },
})

export const toggleFileSearch = (newStatus) => ({
  type: actionTypes.TOGGLE_FILE_SEARCH_FETCH,
  new_state: {
    is_file_search_loading: newStatus,
  },
})


export const toggleKendraSearchView = (newState) => ({
  type: actionTypes.TOGGLE_KENDRA_SEARCH_VIEW,
  new_state: {
    kendra_search_view: newState,
  },
})

// DATA FETCH BEGINS
export const endDataFetch = () => ({
  type: actionTypes.END_DATA_FETCH,
  new_state: {
    data_fetch_in_progress: null,
  },
});

// LOG Action to Feed
export const logActionToFeed = newEvent => ({
  type: actionTypes.LOG_ACTION_TO_FEED,
  new_state: {
    new_event: [newEvent],
  },
});

// Refresh curren graph
export const refreshGraph = newLayout => ({
  type: actionTypes.UPDATE_GRAPH_LAYOUT,
  new_state: {
    current_regraph_layout: newLayout,
  },
});

// Toggle expand graph button
export const toggleExpandGraph = expandGraphToggleNew => ({
  type: actionTypes.TOGGLE_3D_GRAPH,
  new_state: {
    expand_graph_checked: expandGraphToggleNew,
  },
});

// Toggle Sidebar visible state
export const toggleSidebarVisibility = visibleNew => ({
  type: actionTypes.TOGGLE_SIDEBAR_VISIBLE,
  new_state: {
    sidebar_visible: visibleNew,
  },
});

// Toggle & Update clicked link state
export const toggleClickedEnt = clickedNodeNew => ({
  type: actionTypes.TOGGLE_CLICKED_ENT,
  new_state: {
    clicked_ent: clickedNodeNew,
  },
});

// *******************************************
// ************* ASYNC Functions *************
// *******************************************

export const initiateKendraSearch = strToken => (dispatch, getState) => {
  const url = new URL('/api/kendraSearch', window.location.origin);

  const params = { query: strToken };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  dispatch(clearAllAndResetState());

  // Log Action
  dispatch(logActionToFeed({
    date: new Date().toLocaleString(),
    // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
    summary: 'New Search',
    icon: 'search',
    content: `Searched for : ${strToken}`,
  }));

  // Begin data fetch
  dispatch(beginDataFetch(utility.SEARCH_IN_PROGRESS));

  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'GET',
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // CAll the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        dispatch(noResultReceived(myJson.Error));
      } else {
        // console.log(myJson)
        dispatch(validResultReceived(myJson));

        const fileList = new Set();
        myJson.ResultItems.forEach((item) => {
          fileList.add(item.DocumentName);
        });

        dispatch(initiateFetchDocNeighbors([...fileList], true))

        console.log("Dispatched Request to fetch document tags. ")

      }
      // End data fetch
      dispatch(endDataFetch());
    })
    .catch((error) => {
      dispatch(noResultReceived(`Server Request Error: ${error}`));
      console.log(error);

      // End data fetch
      dispatch(endDataFetch());
    });
};

export const initiateFetchDocNeighbors = (ansDocName, initialFetch = false) => (dispatch, getState) => {
  const url = new URL('/api/exploreDoc', window.location.origin);
  const data = { strToken: ansDocName };

  // Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // Begin data fetch
  dispatch(beginDataFetch(utility.EXPAND_GRAPH_IN_PROGRESS));

  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // CAll the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        // dispatch(noResultReceived(myJson.Error));
      } else {
        console.log(myJson)

        if (initialFetch) {
          dispatch(documentTagsReceived(myJson))
        } else {
          dispatch(validGraphDataReceived(myJson.graph_viz_data));
        }

        // Update ent and doc mapping list
        // const currentState = getState();

      }
      // End data fetch
      dispatch(endDataFetch());
    })
    .catch((error) => {
      console.log(error);
      // dispatch(noResultReceived(`Server Request Error: ${error}`));

      // End data fetch
      dispatch(endDataFetch());
    });
};

export const initiateFetchEntNeighbors = (strToken) => (dispatch, getState) => {
  const url = new URL('/api/exploreEnt', window.location.origin);
  const params = { strToken: strToken };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // Begin data fetch
  dispatch(beginDataFetch(utility.EXPAND_GRAPH_IN_PROGRESS));

  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'GET',
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // CAll the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        // dispatch(noResultReceived(myJson.Error));
      } else {
        // const currentState = getState();
        console.log(myJson)

        dispatch(validGraphDataReceived(myJson));        

      }
      // End data fetch
      dispatch(endDataFetch());
    })
    .catch((error) => {
      console.log(error);
      // dispatch(noResultReceived(`Server Request Error: ${error}`));

      // End data fetch
      dispatch(endDataFetch());
    });
};

export const initiateFilesFectch = (key1, key2) => (dispatch, getState) => {
  const url = new URL('/api/getFilesList', window.location.origin);
  const params = { 
    key1: key1, 
    key2: key2
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // Begin data fetch
  // dispatch(beginDataFetch(utility.EXPAND_GRAPH_IN_PROGRESS));

  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'GET',
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // Call the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        // dispatch(noResultReceived(myJson.Error));
      } else {
        // const currentState = getState();
        // console.log(myJson)

        dispatch(validFilesListReceived(myJson));
      }
      // End data fetch
      // dispatch(endDataFetch());
    })
    .catch((error) => {
      console.log(error);

      // End data fetch
      // dispatch(endDataFetch());
    });
};

export const initiateEntitySearch = (entSearchToken) => (dispatch, getState) => {
  const url = new URL('/api/searchEnt', window.location.origin);
  const params = { 
    entSearchToken,
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // Begin data fetch
  dispatch(toggleEntSearch(true));


  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'GET',
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // Call the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        // dispatch(noResultReceived(myJson.Error));
      } else {
        // const currentState = getState();
        // console.log(myJson)

        dispatch(validEntSearchResultsReceived(myJson));

        // End data fetch
        dispatch(toggleEntSearch(false));

        // if (myJson && myJson.documentUrl) {
        //   pdfjs.getDocument({
        //     url: myJson.documentUrl,
        //     eventBusDispatchToDOM: true
        //   }).promise.then(pdfDocObject => {
        //     dispatch(validpdfDocObjectReceived(pdfDocObject))
        //   });
        // }
        
      }
      // End data fetch
      // dispatch(endDataFetch());
    })
    .catch((error) => {
      console.log(error);

      // End data fetch
      // dispatch(endDataFetch());
    });
    
};


export const initiateFileSearch = (fileSearchToken) => (dispatch, getState) => {
  const url = new URL('/api/searchFileName', window.location.origin);
  const params = { 
    fileSearchToken,
  };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  // Begin data fetch
  dispatch(toggleFileSearch(true));


  // Fetch API here
  fetch(url, {
    cache: 'no-cache',
    headers: getHeaders(),
    method: 'GET',
  })
    .then(utility.handleFetchErrors)
    .then(response => response.json())
    .then((myJson) => {
      // Call the next function based on above result
      if (myJson.Error) {
        console.log(`{Info JS] Fetch Error: ${myJson.Error}`);
        // dispatch(noResultReceived(myJson.Error));
      } else {

        dispatch(validFileSearchResultsReceived(myJson));

        // End data fetch
        dispatch(toggleFileSearch(false));

      }
      // End data fetch
      // dispatch(endDataFetch());
    })
    .catch((error) => {
      console.log(error);

      // End data fetch
      // dispatch(endDataFetch());
    });
    
};

