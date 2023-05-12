import path from "path";
import  { fileURLToPath } from 'url';
import HtmlWebpackPlugin from "html-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  entry: "./src/index.jsx",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "build"),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      }
    ],
  },
  resolve: {
    extensions: ["", ".js", ".jsx"],
    fallback: {
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false,
    },
  },
  plugins: [
    new NodePolyfillPlugin({
      excludeAliases: ["console", "net", "tls", "fs", "child_process"],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "build"),
    },
    port: 3000,
  },
  devtool: "eval-cheap-source-map",
};
