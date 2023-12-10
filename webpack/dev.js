import  { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';
import common, { MB, toPath } from './common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: toPath('../build', __dirname),
    },
    port: 3000,
  },
  performance: {
    maxEntrypointSize: 16.2 * MB,
    maxAssetSize: 16.2 * MB
  },
});