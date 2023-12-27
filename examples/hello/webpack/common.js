import path from 'path';
import  { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';


const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export const MB = 1024 * 1024;

export const toPath = (relativePath, parentDir = '') => '/' + path.join(...`${parentDir}/${relativePath}`.split('/'));

export default {
  entry: './src/index.jsx',
  output: {
    filename: 'main.js',
    path: toPath('../build', __dirname),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    fallback: {
      'fs': false,
      'net': false,
      'tls': false,
      'child_process': false,
    },
  },
  plugins: [
    new NodePolyfillPlugin({
      excludeAliases: ['console', 'net', 'tls', 'fs', 'child_process'],
    }),
    new HtmlWebpackPlugin({
      template: toPath('../public/index.html', __dirname),
    }),
  ],
};
