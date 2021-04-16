import * as actionTypes from './actions/globalActionTypes';
import * as utility from './utility';

export const initialState = {
  graph_3d: true,
  sidebar_visible: false,
  data_fetch_in_progress: null,
  comp_para_fetch_in_progress: false,
  received_errorMsg: null,
  search_response: null,
  no_data_found: false,
  ad_less_graph_checked: true,
  expand_graph_checked: false,
  ad_modal_ad_id: null,
  display_ad_modal_toggle: false,
  clicked_link: null,
  clicked_node: null,
  clicked_ent: null,
  current_regraph_layout: "lens",
  regraph_layout_list: [
    'standard',
    'structural',
    'organic',
    'lens',
    'tweak',
    'hierarchy',
    'radial',
    'sequential',
  ],
  trail_degrees_out: 2,
  ad_id_list: [],
  img_id_list: [],
  node_id_list: [],
  link_id_list: [],
  ads_to_links_map: {},
  ads_desc_data: {},
  img_urls_data: {},
  graph_viz_data: {},
  ent_to_file_map: {},
  file_to_ent_map: {},  
  graph_component_ref: null,
  sub_graphs_table_data: [],
  kendra_results: {},
  kendra_num_results: null,
  files_list_tree_data: [],
  current_paragraph: null,
  current_paragraph_key: null,
  current_documentId: null, 
  current_document_name: null,
  current_document_url: null, 
  current_paragraph_key_list: [],
  pdf_doc_object: null,
  unique_entities: null,
  ent_tags: null,
  current_ent_tag: null,
  ent_search_results: null,
  is_ent_search_loading: false,
  kendra_search_view: true,
  file_search_results: [],
  is_file_search_loading: false,
};

const eternalState = {
  ...initialState,
  action_feed_events: [
    {
      date: new Date().toLocaleString(),
      // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
      icon: 'power',
      // meta: '4 Likes',
      summary: 'KG: Loaded',
    },
  ],
};


const mainReducer = (state = eternalState, action) => {
  switch (action.type) {
    case actionTypes.CLEAR_ALL:
      return utility.updateObject(state, initialState);
    case actionTypes.CLEAR_GRAPH_DATA:
      return utility.updateObject(state, action.new_state);  
    case actionTypes.TOGGLE_KENDRA_SEARCH_VIEW:
      return utility.updateObject(state, action.new_state);
    case actionTypes.TOGGLE_3D_GRAPH:
      return utility.updateObject(state, action.new_state);
    case actionTypes.UPDATE_CURRENT_DOCID:
      return utility.updateObject(state, action.new_state);  
    case actionTypes.UPDATE_NER_TAGS:
      return utility.updateObject(state, action.new_state);    
    case actionTypes.TOGGLE_SIDEBAR_VISIBLE:
      return utility.updateObject(state, action.new_state);
    case actionTypes.TOGGLE_AD_LESS_GRAPH:
      return utility.updateObject(state, action.new_state);
    case actionTypes.TOGGLE_CLICKED_LINK:
      return utility.updateObject(state, action.new_state);
    case actionTypes.TOGGLE_COMP_PARA_FETCH:
      return utility.updateObject(state, action.new_state);  
    case actionTypes.TOGGLE_CLICKED_ENT:
      return utility.updateObject(state, action.new_state);
    case actionTypes.TOGGLE_DISPLAY_ADMODAL:
      return utility.updateObject(state, action.new_state);
    case actionTypes.VALID_RESULT_RECEIVED:
      return utility.updateObject(state, action.new_state);
    case actionTypes.VALID_FILE_SEARCH_RECEIVED:
      return utility.updateObject(state, action.new_state);    
    case actionTypes.VALID_ENT_SEARCH_RECEIVED:
      return utility.updateObject(state, action.new_state);  
    case actionTypes.VALID_GRAPH_DATA_UPDATE_RECEIVED:
      return {
        ...state,
        graph_viz_data: {
          ...state.graph_viz_data,
          ...action.new_state.newGraphData,
        }
      }  
    case actionTypes.ADD_NEW_ENTITY_FOR_LABEL:
      return {
        ...state,
        unique_entities: {
          ...state.unique_entities,
          ...action.new_state.new_ent,
        }
      }
    case actionTypes.VALID_PDF_DOC_OBJ_RECEIVED:
      return utility.updateObject(state, action.new_state);  
    case actionTypes.VALID_FILES_LIST_RECEIVED:
      return utility.updateObject(state, action.new_state);    
    case actionTypes.VALID_COMP_PARA_RECEIVED:
      return utility.updateObject(state, action.new_state);    
    case actionTypes.UPDATE_GRAPH_COMPONENT_REF:
      return utility.updateObject(state, action.new_state);
    case actionTypes.UPDATE_GRAPH_LAYOUT:
      return utility.updateObject(state, action.new_state);
    case actionTypes.UPDATE_TRAIL_DEGREES:
      return utility.updateObject(state, action.new_state);
    case actionTypes.LOG_ACTION_TO_FEED:
      return {
        ...state,
        action_feed_events: [...action.new_state.new_event, ...state.action_feed_events],
      };
    case actionTypes.VALID_ENT_DOC_MAPPING_RECEIVED:
      return {
        ...state,
        ent_to_file_map: {
          ...state.ent_to_file_map,
          ...action.new_state.new_ent_to_file_map,
        },
        file_to_ent_map: {
          ...state.file_to_ent_map,
          ...action.new_state.new_file_to_ent_map,
        },
      };
    case actionTypes.VALID_IMG_URLS_RECEIVED:
      return {
        ...state,
        img_urls_data: {
          ...state.img_urls_data,
          ...action.new_state.img_urls_data,
        },
      };
    case actionTypes.VALID_ADS_DESC_RECEIVED:
      return {
        ...state,
        ads_desc_data: {
          ...state.ads_desc_data,
          ...action.new_state.ads_desc_data,
        },
      };
    case actionTypes.VALID_NEIGHBORS_FOUND:
      return {
        ...state,
        node_id_list: [...state.node_id_list, ...action.new_state.node_id_list],
        link_id_list: [...state.link_id_list, ...action.new_state.link_id_list],
        ad_id_list: [...state.ad_id_list, ...action.new_state.ad_id_list],
        img_id_list: [...state.img_id_list, ...action.new_state.img_id_list],
        graph_viz_data: {
          ...state.graph_viz_data,
          nodes: [...state.graph_viz_data.nodes, ...action.new_state.nodesList],
          links: [...state.graph_viz_data.links, ...action.new_state.linksList],
        },
      };
    case actionTypes.NO_RESULT_RECEIVED:
      return utility.updateObject(state, action.new_state);
    case actionTypes.BEGIN_DATA_FETCH:
      return utility.updateObject(state, action.new_state);
    case actionTypes.END_DATA_FETCH:
      return utility.updateObject(state, action.new_state);
    default:
      return state;
  }
};

export default mainReducer;
