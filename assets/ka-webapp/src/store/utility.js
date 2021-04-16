export const handleFetchErrors = (response) => {
  if (!response.ok) {
    console.log(`[Node JS ERROR] Fetch API error${response.statusText}`);
    throw Error(response.statusText);
  }
  return response;
};

export const updateObject = (oldObject, updatedValues) => ({
  ...oldObject,
  ...updatedValues,
});

export const AD_BLUE_COLOR = '#71A9F7';
// export const AD_HIGHLIGHT_COLOR = '#feffc4';

// export const AD_HIGHLIGHT_COLOR = '#81bcbb';
export const AD_HIGHLIGHT_COLOR = '#dac6c6';

export const SEARCH_IN_PROGRESS = 'SEARCH_IN_PROGRESS';
export const EXPAND_GRAPH_IN_PROGRESS = 'EXPAND_GRAPH_IN_PROGRESS';
