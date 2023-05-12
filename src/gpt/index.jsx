import React from 'react';
import { render, fakeDom } from './customRenderer.js';
import { serialize } from './serialize.js';
import { deserialize } from './deserialize.js';

// Your React subtree
const App = () => {
  return (
    <div>
      <h1>Hello, sandbox!</h1>
    </div>
  );
};

// Create a virtual container for your subtree
// const virtualContainer = fakeDom.window.document.createElement('div');
// Create a real container in the actual DOM
const realContainer = document.getElementById('root');

// Render your subtree using the custom renderer
render(
  <App />,
);

// // Serialize the virtual DOM
// const serializedTree = serialize(virtualContainer);

// // Deserialize the serialized tree into the real container
// deserialize(serializedTree, realContainer);
