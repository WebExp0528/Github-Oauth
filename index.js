const path = require("path");
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

app.use(morgan("tiny")); // logging framework
app.use(cors());
app.use(
  "/api/login",
  createProxyMiddleware({
    target: "https://github.com",
    pathRewrite: {
      "^/api": "/",
    },
    headers: {
      accept: "application/json",
    },
    changeOrigin: true,
  })
);

app.use(
  "/api",
  createProxyMiddleware({
    target: "https://api.github.com",
    changeOrigin: true,
    pathRewrite: {
      "^/api": "/",
    },
  })
);

if (process.env.NODE_ENV === "production") {
  // Express will serve up production assets
  app.use(express.static("build"));

  // Express will serve up the front-end index.html file if it doesn't recognize the route
  app.get("*", (req, res) => res.sendFile(path.resolve("build", "index.html")));
}

// Choose the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Mixing it up on port ${PORT}`));
