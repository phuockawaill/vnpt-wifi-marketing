const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
var config = {
    context: __dirname + "/app",
    entry: {
        app: ['babel-polyfill', __dirname + "/app/shopOnline.jsx"],
        vendor: [
            'react', 'react-router', 'react-redux', 'redux', 'lodash', 'moment', 'apollo-client', 'react-apollo', 'graphql-tag'
        ],
        meteor: __dirname + '/app/meteor-client'
    },
    output: {
        filename: "[name].[hash]:6.js",
        chunkFilename: "[name].[hash:6].js",
        path: __dirname + "/dist",
        publicPath: '/'
    },
    plugins: [
        new CleanWebpackPlugin(['dist']),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './index.html'),
            filename: 'index.html',
            inject: 'body',
        })
    ],
    module: {
        rules: [{
                test: /\.jsx?$/,
                exclude: "/node_modules",
                use: ['babel-loader'],
                include: path.join(__dirname, "app")
            },{
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },{
                test: /\.(ttf|eot|svg|gif|png|jpg|jpeg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                loaders: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            gifsicle: {
                              interlaced: false,
                            },
                            optipng: {
                              optimizationLevel: 0,
                            },
                            pngquant: {
                              quality: '65-90',
                              speed: 4
                            },
                            mozjpeg: {
                              progressive: true,
                              quality: 65
                            }
                        }
                    }
                ]
            }],
    },
    optimization: {
        splitChunks: {
            chunks: "async",
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "node_modules",
                    chunks: "all"
                },
                commons: {
                    name: "commons",
                    chunks: "initial",
                    minChunks: 2
                }
            }
        }
    },
    resolve: {
        alias: {
            "config-app": __dirname + "/app/config",
            "collections-root": __dirname + "/app/collections",
            "component-common": __dirname + "/app/components/common",
            "ag-grid-root" : __dirname + "/node_modules/ag-grid",
            "react-grid-layout-root" : __dirname + "/node_modules/react-grid-layout",
            "react-resizable-root" : __dirname + "/node_modules/react-resizable",
            "rc-slider-root" : __dirname + "/node_modules/rc-slider",
            "jsoneditor-root" : __dirname + "/node_modules/jsoneditor",
            "slick-carousel-root" : __dirname + "/node_modules/slick-carousel",
            "meteor-client": __dirname + "/app/meteor-client",
            "extendLib": __dirname + "/app/assets"
        }
    },
    node: { fs: 'empty' }
};
module.exports = config;
