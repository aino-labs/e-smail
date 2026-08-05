import { merge } from "webpack-merge";
import common from "./webpack.common.js";

export default merge(common, {
  mode: "development",
  devtool: "eval-source-map",

  output: {
    filename: "[name].js",
    chunkFilename: "[name].chunk.js",
  },

  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: { filter: (url) => !url.startsWith("/assets/") },
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  devServer: {
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ["/api/v1/user"],
        target: "http://localhost:8081",
      },
      {
        context: ["/api/v1/email"],
        target: "http://localhost:8082",
      },
      {
        context: ["/api/v1/folder"],
        target: "http://localhost:8083",
      },
      {
        context: ["/api/v1/support"],
        target: "http://localhost:8084",
      },
    ],
  },
});
