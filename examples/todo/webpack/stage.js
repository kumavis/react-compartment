import  { fileURLToPath } from 'url';
import { merge } from 'webpack-merge';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import prod from './prod.js';
import { toPath } from './common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default merge(prod, {
  devServer: {
    static: {
      directory: toPath('../build', __dirname),
    },
    port: 3000,
  },
  plugins: [
    new BundleAnalyzerPlugin(),
  ]
});