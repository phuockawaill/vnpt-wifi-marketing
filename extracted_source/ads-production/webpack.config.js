const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const client = path.join(__dirname, 'client');
const clientHost = process.env.HOST || '127.0.0.1';
const clientPort = process.env.PORT || 9001;

module.exports = (function makeWebpackConfig() {
  const config = {};

  config.resolve = {
    modules: [client, 'node_modules'],
  };

  config.devtool = 'eval';
  config.output = {
    path: `${__dirname}/dist/client`,
    publicPath: `http://${clientHost}:${clientPort}/`,

    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',

    hashDigest: 'hex',
    hashFunction: 'md5',

    pathinfo: true,
  };

  config.module = {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [['transform-runtime', { polyfill: false }]],
            },
          },
        ],
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        use: 'json-loader',
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader', options: { sourceMap: true } },
            'postcss-loader',
          ],
        }),
      },
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader', options: { sourceMap: true } },
            'postcss-loader',
            { loader: 'less-loader', options: { sourceMap: true } },
          ],
        }),
      },
      {
        test: /\.(png|jpg|jpeg|ico|gif|svg|woff|woff2|ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader',
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        test: /\.(jade|pug)$/,
        exclude: [/\.(template|ng)\.(jade|pug)$/],
        use: ['html-loader', 'pug-html-loader'],
      },
      {
        test: /\.(template|ng)\.(jade|pug)$/,
        use: [
          'ngtemplate-loader?relativeTo=client/app/components/',
          'html-loader',
          'pug-html-loader',
        ],
      },
    ],
  };

  config.entry = {
    '1.app': `${client}/app/app.js`,
  };

  config.plugins = [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    new webpack.LoaderOptionsPlugin({ options: { postcss: [autoprefixer] } }),

    new ExtractTextPlugin({
      filename: '[name].[chunkhash].css',
      disable: true,
    }),

    new HtmlWebpackPlugin({
      template: `!!pug-loader!${client}/index.pug`,
      inject: 'body',
      chunksSortMode: (a, b) => {
        if (a.names[0] > b.names[0]) {
          return 1;
        }
        if (a.names[0] < b.names[0]) {
          return -1;
        }
        return 0;
      },
    }),

    new webpack.optimize.CommonsChunkPlugin({
      name: '0.vendor',
      minChunks: function chunk(module) {
        return module.context && module.context.indexOf('node_modules') !== -1;
      },
    }),

    new webpack.optimize.CommonsChunkPlugin({
      async: true,
    }),
  ];

  config.devServer = {
    inline: true,
    hot: true,
    openPage: '',
    port: clientPort,
    host: clientHost,
    stats: { colors: true },
    proxy: {
      '/ckeditor/*': `http://${clientHost}:3000`,
      '/images/*': `http://${clientHost}:3000`,
      '/lib/*': `http://${clientHost}:3000`,
    },
    historyApiFallback: true,
    disableHostCheck: true
  };

  return config;
}());
