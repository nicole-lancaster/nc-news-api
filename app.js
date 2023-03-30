const express = require("express");
const app = express();

const { getTopics } = require("./controllers/topics.controllers.js");
const {
  getArticlesById,
  getAllArticles,
  getCommentsByArticleId, postCommentByArticleId,
} = require("./controllers/articles.controllers");
const {
  badUrlHandling,
  customErrorMiddleware,
  handlePsqlErrorsMiddleware,
} = require("./controllers/error.controllers.js");

app.use(express.json());

app.get("/api/topics", getTopics);
app.get("/api/articles", getAllArticles);
app.get("/api/articles/:article_id", getArticlesById);
app.get("/api/articles/:article_id/comments", getCommentsByArticleId);
app.post("/api/articles/:article_id/comments", postCommentByArticleId);

app.use(customErrorMiddleware);
app.use(handlePsqlErrorsMiddleware);

app.all("/*", badUrlHandling);

module.exports = app;
