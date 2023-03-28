const articles = require("../db/data/test-data/articles.js");
const { fetchArticlesById } = require("../models/articles.models.js");

const getArticlesById = (request, response, next) => {
  const { article_id } = request.params;
  if (isNaN(article_id)) {
    const err = { status: 400, msg: "Article ID invalid - must be a number" }
    next(err)
  }
  const articlePromise = fetchArticlesById(article_id);
  articlePromise
    .then((article) => {
      return response.status(200).send({ article: article });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = { getArticlesById };
