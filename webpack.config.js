var path = require("path");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
module.exports = {
  entry: path.resolve(__dirname, "src/js/main.js"),
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "js/XtPlayer-1.2.0.min.js"
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env"]
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [new UglifyJSPlugin()]
  }
};
