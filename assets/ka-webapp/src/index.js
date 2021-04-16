import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import mainReducer from './store/mainReducer';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Logger middleware
const logger = store => next => (action) => {
  // console.log("[Logger] Current state", store.getState());
  console.log(`[Logger] Dispatching: ${action.type}`, action);
  const result = next(action);
  // console.log("[Logger] After Dispatch", store.getState());
  return result;
};

// Redux Store
const store = createStore(mainReducer, composeEnhancers(applyMiddleware(logger, thunk)));


ReactDOM.render(
  <Provider store={store}>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
