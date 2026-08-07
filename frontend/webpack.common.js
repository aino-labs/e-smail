import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import GeneratePrecacheManifest from "./webpack/GeneratePrecacheManifest.js";
import webpack from "webpack";
import { readFileSync } from "fs";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service version
const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

export default (env, argv) => {
  const isProd = argv?.mode === "production";
  const styleLoader = isProd ? MiniCssExtractPlugin.loader : "style-loader";

  return {
    entry: {
      main: "./src/App.tsx",
    },

    output: {
      path: path.resolve(__dirname, "./build"),
      publicPath: "/",
      clean: true,
    },

    resolve: {
      extensions: [".tsx", ".jsx", ".ts", ".js"],
      conditionNames: isProd
        ? ["production", "import", "module", "require"]
        : ["development", "import", "module", "require"],
      alias: {
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        "@react": path.resolve(__dirname, "src/react"),
        "@icons": path.resolve(__dirname, "public/assets/svg/_index.ts"),
        ...(isProd && {
          "react-router": path.resolve(
            __dirname,
            "node_modules/react-router/dist/production/index.mjs",
          ),
          "react-router-dom": path.resolve(
            __dirname,
            "node_modules/react-router-dom/dist/production/index.mjs",
          ),
        }),
      },
    },

    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
          },
        },
      },
    },

    module: {
      rules: [
        // TypeScript / React
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: [
                  "@babel/preset-env",
                  "@babel/preset-typescript",
                  [
                    "@babel/preset-react",
                    {
                      runtime: "automatic",
                    },
                  ],
                ],
                plugins: [["babel-plugin-react-compiler", {}]],
              },
            },
          ],
        },
        // SVGR Loader Configuration
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: [/url/] }, // Default import -> React Component
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                icon: true, // Scales icon relative to current font-size
                svgo: true, // Optimizes SVG code automatically
              },
            },
          ],
        },
        {
          test: /\.svg$/i,
          type: "asset/resource", // Webpack 5 native asset module (replaces file-loader)
          resourceQuery: /url/, // Used when importing with ?url suffix
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            styleLoader,
            {
              loader: "css-loader",
              options: {
                url: { filter: (url) => !url.startsWith("/assets/") },
              },
            },
            "postcss-loader",
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  charset: false,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            styleLoader,
            {
              loader: "css-loader",
              options: {
                url: { filter: (url) => !url.startsWith("/assets/") },
              },
            },
            "postcss-loader",
          ],
        },
      ],
    },

    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(argv.mode || "development"),
        __APP_VERSION__: JSON.stringify(pkg.version),
      }),
      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "index.html",
        favicon: "./public/assets/svg/favicon.svg",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "public/sw.js",
            to: "sw.js",
            transform: (content) => {
              const version = Date.now();
              return `${content.toString()}\nconst BUILD_VERSION = ${version};`;
            },
          },
          {
            from: "**/*",
            to: "assets/",
            context: "public/assets/",
            noErrorOnMissing: true,
          },
        ],
      }),
      new GeneratePrecacheManifest(),
    ],
  };
};
