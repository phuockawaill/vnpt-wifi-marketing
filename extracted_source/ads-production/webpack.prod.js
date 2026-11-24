const webpack = require('webpack');
const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
// const OfflinePlugin = require('offline-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: "cheap-module-source-map",
  output: {
      filename: "[name].[hash].js",
      chunkFilename: "[name].[hash].js",
      path: __dirname + "/dist",
      crossOriginLoading: "anonymous",
      publicPath: '/static/'
  },
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        output: {
          ascii_only: true
        }
      }
    }),
    new webpack.LoaderOptionsPlugin({minimize: true}),
    new webpack.DefinePlugin({'process.env.NODE_ENV': JSON.stringify('production')}),
    // new OfflinePlugin({
    //   ServiceWorker: {
    //     minify: false
    //   }
    // })
  ]
});
