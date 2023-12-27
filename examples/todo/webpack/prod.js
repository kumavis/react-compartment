import { merge } from 'webpack-merge';
import common, { MB } from './common.js';

export default merge(common, {
  mode: 'production',
  performance: {
    maxEntrypointSize: 6 * MB,
    maxAssetSize: 6 * MB
  },
});