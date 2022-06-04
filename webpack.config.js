const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
//const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].bundle.js",
        assetModuleFilename: "images/[name][ext]",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.(png|jpg|gif)$/,
                type: "asset",
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: "file-loader",
                options: {
                    name: "asset/image/[name].[ext]?[hash]"
                }
            },
            {
                test: /\.(mp3|ogg|wav)$/,
                loader: "file-loader",
                options: {
                    name: "asset/audio/[name].[ext]?[hash]"
                }
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
            }
        ],
    },
    resolve: {
        modules: [path.join(__dirname, "src"), "node_modules"],
        extensions: [".ts", ".js"],
        alias: {
            "@src": path.join(__dirname, "src")
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
        new ESLintPlugin({
            extensions: "ts",
        }),
        //new BundleAnalyzerPlugin(),
    ],
    devServer: {
        host: "0.0.0.0",
        port: 20310,
        allowedHosts: [
            "nonamehome.iptime.org",
        ],
        client: {
            logging: "none",
        },
    },
    mode: "development",
};
