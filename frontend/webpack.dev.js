import { merge } from "webpack-merge";
import common from "./webpack.common.js";

export default (env, argv) =>
  merge(common(env, { ...argv, mode: "development" }), {
    mode: "development",
    devtool: "eval-source-map",

    output: {
      filename: "[name].js",
      chunkFilename: "[name].chunk.js",
    },

    devServer: {
      port: 3000,
      open: true,
      hot: true,
      historyApiFallback: true,
      proxy: [
        { context: ["/api/v1/user"], target: "http://localhost:8081" },
        { context: ["/api/v1/email"], target: "http://localhost:8082" },
        { context: ["/api/v1/folder"], target: "http://localhost:8083" },
        { context: ["/api/v1/support"], target: "http://localhost:8084" },
      ],
    },
  });
