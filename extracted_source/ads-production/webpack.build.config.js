const webpack = require('webpack');
const Merge = require('webpack-merge');
const NgAnnotatePlugin = require('ng-annotate-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const commonConfig = require('./webpack.config.js');

module.exports = Merge(commonConfig, {
  output: {
    publicPath: '/',
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
  },

  devtool: 'cheap-source-map',
  // devtool: 'source-map',

  plugins: [
    new NgAnnotatePlugin({ add: true }),

    new ExtractTextPlugin({ filename: '[name].[chunkhash].css' }),

    // new webpack.LoaderOptionsPlugin({
    //   minimize: true,
    //   debug: false,
    // }),
    // new webpack.DefinePlugin({
    //   'process.env': {
    //     NODE_ENV: JSON.stringify('production'),
    //   },
    // }),
    // new webpack.optimize.UglifyJsPlugin({
    //   beautify: false,
    //   mangle: {
    //     screw_ie8: true,
    //     keep_fnames: true,
    //   },
    //   compress: {
    //     screw_ie8: true,
    //   },
    //   comments: false,
    //   sourceMap: true,
    // }),
    new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
    // new webpack.optimize.ModuleConcatenationPlugin(),
  ],
});
