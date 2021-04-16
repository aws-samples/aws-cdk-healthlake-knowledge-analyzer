/* eslint-disable no-undef */

/* eslint-disable no-undef */

import React, { useRef, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Graphin, { Utils, Layout } from '@antv/graphin';
import ReactResizeDetector from 'react-resize-detector';
import { connect } from 'react-redux';

import has from 'lodash/has';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';

import '@fortawesome/fontawesome-free/css/fontawesome.css';
import '@fortawesome/fontawesome-free/css/solid.css';

import '@antv/graphin/dist/index.css'; // 引入Graphin CSS
import '@antv/graphin-components/dist/index.css'; // 引入Graphin CSS
import GraphVizControls from './GraphVizControls';

import * as actionCreators from '../store/actions/globalActions';



class GraphinVizArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            highlightLink: null,
            openCombos: {},
            combine: { properties: ["entType"], level: 1 },
            // graphRef: React.createRef(null),
        };
    }

    // *******************************************************
    // OLD
    // *******************************************************
    styleItem = (item) => {
        const glyphs = {};
        const hasAlert = item.data && item.data.alert;
        const isNode = !has(item, 'id1');
        const palette = {
            'commercial_item': '#8dd3c7',
            'date': '#e31a1c',
            'event': '#bebada',
            'location': '#fb8072',
            'organization': '#80b1d3',
            'other': '#fdb462',
            'person': '#b3de69',
            'quantity': '#fccde5',
            'title': '#bc80bd',
            'COMPANY': '#d9d9d9',
            'DRUGPACK': '#ccebc5',
            'EDAM': '#ffed6f',
            'FREQ': 'a6cee3',
            'LABCHEM': '#1f78b4',
            'MATPROP': '#b2df8a',
            'MOA': '#33a02c',
            'PHARMDOSFORME': '#fb9a99',
            'PHASE': '#ffffb3',
            'STATO': '#fdbf6f'
        }

        if (!isNode) {
            return { ...item, color: hasAlert ? '#b7336a' : '#79bdfc', width: 2 };
        }
        else {

            const entType = item.data.comboId || "DOC";
            const ent_icon = {
                "organization": { "text": "fa fa-building", "color": palette[entType] },
                "date": { "text": "fa fa-calendar", "color": palette[entType] },
                "commercial_item": { "text": "fa fa-usd", "color": palette[entType] },
                "event": { "text": "fa fa-bookmark", "color": palette[entType] },
                "location": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
                "other": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
                "person": { "text": "fa fa-user", "color": palette[entType] },
                "quantity": { "text": "fa fa-balance-scale", "color": palette[entType] },
                "title": { "text": "fa fa-comments", "color": palette[entType] },
            }
            //   const fontIcon = ent_icon[entType] || { "text": "fas fa-circle", "color": palette[entType] }
            return (item)

            //   return merge(
            //     item,
            //     {
            //       label: { center: false },
            //       fontIcon,
            //       "color": "transparent",
            //     },
            //   );
        }
    }

    logNodeClicktoFeed = (node, type) => {
        const {
            logActionToFeed, graphVizData,
        } = this.props;

        const token = (type == "ent") ? `${graphVizData[node].data.comboId}` : "document."

        let logMsg = {
            date: new Date().toLocaleString(),
            icon: (type == "ent") ? "object ungroup outline" : 'file outline',
            summary: `Selected: "${graphVizData[node].label}"`,
            content: `Type: ${token}`,
        };

        // Log Action to Feed
        logActionToFeed(logMsg);
    };


    handleLinkHover = (link) => {
        this.setState({
            highlightLink: link,
        });
    };

    handleLinkClick = (link) => {
        const {
            handleLinkClick, logActionToFeed, linksToAdsMap,
        } = this.props;

        let logMsg = {
            date: new Date().toLocaleString(),
            // image: 'https://react.semantic-ui.com/images/avatar/small/jenny.jpg',
            icon: 'arrows alternate horizontal',
            summary: `Clicked Link between ${link.id.split('-')[0]} and ${link.id.split('-')[1]}`,
        };

        try {
            const content = `This link corresponds to ${linksToAdsMap.links[link.id].length} ads.`;
            const extraText = `${linksToAdsMap.links[link.id].join(', ')}`;
            logMsg = {
                ...logMsg,
                content,
                extraText,
            };
        } catch (e) { }

        logActionToFeed(logMsg);
        handleLinkClick(link);
    };

    // *******************************************************
    // New  Function
    // *******************************************************  
    combineNodesHandler = ({ id, nodes, combo }) => {
        const { openCombos } = this.state;

        const groupNode = {
            open: !!openCombos[id],
            label: {
                text: combo.entType,
                backgroundColor: 'rgba(0,0,0,0)',
                center: false,
            },
            data: {
                'entType': combo.entType,
            },
            // arrange: 'concentric'
        }

        return this.styleItem(groupNode)
    }

    doubleClickHandler = (id) => {
        const { openCombos, combine } = this.state;
        this.setState({
            openCombos: { ...openCombos, [id]: !openCombos[id] },
            combine: { ...combine },
        });
    }

    
    handleChartClick = (node) => {
        const { graphVizData, expandGraphActive, getDocNeighbors, getEntNeighbors, handleEntClick } = this.props;

        if (node in graphVizData) {
            const type = graphVizData[node].data.type
            this.logNodeClicktoFeed(node, type);
            if (expandGraphActive && type == "doc") {
                console.log(`Dispatching np doc fetch for : ${graphVizData[node].data.kendraDocumentName}`)
                getDocNeighbors(graphVizData[node].data.kendraDocumentName);
            } else if (expandGraphActive) {
                console.log(`Dispatching np ent fetch for : ${graphVizData[node].label.text}`)
                getEntNeighbors(graphVizData[node].label.text);
            }

            if (type == "ent") {
                handleEntClick(graphVizData[node].label.text);
            } else {
                handleEntClick(null);
            }

        } else {
            handleEntClick(null);
        }

        // handleEntClick(node);

        // if (expandGraphActive) {
        //   initiateFetchDocNeighbors(node, adLessGraphChecked);
        // }

    };






    


    renderGraph() {
              
    
        // const data = Utils.mock(15).tree().combos(5).graphin()
        const { graphVizData, layoutName, graph3DToggle } = this.props;
        // const { combine } = this.state;

        
        const convdata = Object.values(graphVizData)

        let output = convdata.filter(obj => Object.keys(obj).includes("id"));
        let comboout = convdata.filter(obj => !Object.keys(obj).includes("shape") && !Object.keys(obj).includes("source"));
        let edgeout = convdata.filter(obj => Object.keys(obj).includes("target"));


        // const node1 = Layout.Circle({ nodes: output}, { x: 10, y: 10, scale: 0.8 });

        // // const newNodes = [...node1.nodes];
        // let entoutput = convdata.filter(obj => Object.keys(obj).includes("comboId") && Object.keys(obj).includes("id"));
        // let sourceoutput = convdata.filter(obj => Object.keys(obj).includes("shape") && Object.keys(obj).includes("id"));
        // let comboout = convdata.filter(obj => !Object.keys(obj).includes("shape") && !Object.keys(obj).includes("source"));
        
        // console.log(comboout)
        // console.log(singleNodes)
        let data = {
            nodes: output,
            combos: comboout,
            edges: edgeout
        };

        
        const layoutOptions = {
            name: 'graphin-force', 
            options: {
                preventOverlap: true,
            //   preset: {
            //     name: 'grid', // 力导的前置布局可以人为指定，试试 grid
            //   },
            //   centripetalOptions: {
            //     single: 100, // 给孤立节点设置原来 （100/2）倍的向心力
            //     leaf: 100,
            //     others: 100,
            //     center: (node, degree) => {
            //       // console.log('node', node)
            //       let center = {};
            //       data.combos.forEach(combo => {
            //         if (node.data.comboId === combo.id) {
            //           center = {
            //             x: combo.x,
            //             y: combo.y,
            //           };
            //         }
            //       });
            //       return center;
            //       // 根据不同的节点与度数设置不同的向心力的中心点
            //     },
            //   },
            },
          };

        // const node1 = Layout.Circle({ nodes: output}, { x: 10, y: 1, scale: 0.02 });


        // layout the part1
        // const node1 = Layout.Circle({ nodes: circleNodes, edges: edges }, { x: 100, y: 100, r: 80 });

        const finaldata = {
            nodes: output,
            combos: comboout,
            edges: edgeout
        };

        const App = () => {
            const [state, setState] = React.useState({
                selected: [],
                data: finaldata,
            });
            const { data, selected } = state;
            const graphRef = React.createRef(null);
            React.useEffect(() => {
                const { graph } = graphRef.current;
                const handleChartClick = (node) => {
                    const { graphVizData, expandGraphActive, getDocNeighbors, getEntNeighbors, handleEntClick } = this.props;
            
                    if (node in graphVizData) {
                        const type = graphVizData[node].data.type
                        this.logNodeClicktoFeed(node, type);
                        if (expandGraphActive && type == "doc") {
                            console.log(`Dispatching np doc fetch for : ${graphVizData[node].data.kendraDocumentName}`)
                            getDocNeighbors(graphVizData[node].data.kendraDocumentName);
                        } else if (expandGraphActive) {
                            console.log(`Dispatching np ent fetch for : ${graphVizData[node].label.text}`)
                            getEntNeighbors(graphVizData[node].label.text);
                        }
            
                        if (type == "ent") {
                            handleEntClick(graphVizData[node].label.text);
                        } else {
                            handleEntClick(null);
                        }
            
                    } else {
                        handleEntClick(null);
                    }
            
                    // handleEntClick(node);
            
                    // if (expandGraphActive) {
                    //   initiateFetchDocNeighbors(node, adLessGraphChecked);
                    // }
            
                };
                graph.on('node:click', handleChartClick);
                return () => {
                    graph.off('node:click', handleChartClick);
                };
            }, [state]);
        

        }


        
        console.log(finaldata.nodes)
        // const finaldata = layout(data);
        // var data = arr.map(person => ({ value: person.id, text: person.name }));
        // console.log(convdata)

        // listen to the node click event
        // const graphRef = React.createRef(null);
        // const { graph } = graphRef.current;


        return (
            <Graphin
                data={finaldata}
                // layout={layoutOptions}
                layout={{
                    name: 'comboForce',
                    // nodeStrength: 30,
                    // collideStrength: 0.7,
                    // alphaDecay: 0.01,
                    preventOverlap: true,
                    preventNodeOverlap: true,
                    preventComboOverlap: true,
                    comboPadding: 10,
                    // options: {
                    //   preset: { name: 'concentric' },
                    //   preventOverlap: true,
                    //   centripetalOptions: {
                    //     single: 100, // 给孤立节点设置原来 （100/2）倍的向心力
                    //     center: () => {
                    //       // 根据不同的节点与度数设置不同的向心力的中心点
                    //       return {
                    //         x: 100,
                    //         y: 100,
                    //         r: 10,
                    //       }
                    //     },
                    //   },
                    // },
                  }}
                  ref={this.App}
            />
        );
    }
    render() {
        const { noDataFound } = this.props;
        let renderGraph;


        if (noDataFound) {
            renderGraph = (
                <span style={{ height: '30px', lineHeight: '100%' }}>
                    {' '}
                    <br />
                    {' '}
                    <br />
                    {' '}
              No data found
                    {' '}
                </span>
            );
        } else {
            renderGraph = this.renderGraph();
        }

        return (
            <div className="d3area" ref={el => (this.container = el)}>
                <GraphVizControls />
                <ReactResizeDetector handleWidth handleHeight>
                    {renderGraph}
                </ReactResizeDetector>
            </div>
        );
    }
};

function mapStateToProps(state) {
    return {
      graphVizData: state.graph_viz_data,
      noDataFound: state.no_data_found,
      adLessGraphChecked: state.ad_less_graph_checked,
      clickedLink: state.clicked_link,
      expandGraphActive: state.expand_graph_checked,
      imgUrls: state.img_urls_data,
      linksToAdsMap: state.ads_to_links_map,
      graph3DToggle: state.graph_3d,
      layoutName: state.current_regraph_layout,
    };
  }

function mapDispatchToProps(dispatch) {
  return {
    getDocNeighbors: (docName) => dispatch(actionCreators.initiateFetchDocNeighbors([docName])),
    getEntNeighbors: (strToken) => dispatch(actionCreators.initiateFetchEntNeighbors(strToken)),
    logActionToFeed: newEvent => dispatch(actionCreators.logActionToFeed(newEvent)),
    handleEntClick: node => dispatch(actionCreators.toggleClickedEnt(node)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphinVizArea);

// export default GraphinVizArea;
