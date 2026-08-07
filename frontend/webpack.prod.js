import { merge } from "webpack-merge";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import ImageMinimizerPlugin from "image-minimizer-webpack-plugin";
import common from "./webpack.common.js";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

export default (env, argv) =>
  merge(common(env, { ...argv, mode: "production" }), {
    mode: "production",
    devtool: "source-map",

    output: {
      filename: "js/[name].[contenthash].js",
      chunkFilename: "js/[name].[contenthash].chunk.js",
      assetModuleFilename: "assets/[name].[contenthash][ext]",
    },

    optimization: {
      minimize: true,
      minimizer: [
        new CssMinimizerPlugin(),
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.imageminMinify,
            options: {
              plugins: [
                ["imagemin-mozjpeg", { quality: 80 }],
                ["imagemin-pngquant", { quality: [0.6, 0.8] }],
              ],
            },
          },
        }),
      ],
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: "css/[name].[contenthash].css",
        chunkFilename: "css/[name].[contenthash].css",
      }),
      process.env.ANALYZE &&
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerPort: 8888,
          openAnalyzer: true,
        }),
    ].filter(Boolean),
  });
