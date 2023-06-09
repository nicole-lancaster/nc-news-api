const {
  fetchArticlesById,
  fetchAllArticles,
  fetchCommentsByArticleId,
  insertCommentByArticleId,
  updateArticleById,
  deletingCommentFromDb,
} = require("../models/articles.models.js");

const getAllArticles = (request, response, next) => {
  const { topic } = request.query

  const sortBy = request.query.sort_by;
  const sortOrder = request.query.order
  fetchAllArticles(topic, sortBy, sortOrder)
    .then((articles) => {
      return response.status(200).send({ articles: articles });
    })
    .catch(next);
};

const getArticlesById = (request, response, next) => {
  const { article_id } = request.params;
  const articlePromise = fetchArticlesById(article_id);
  articlePromise
    .then((article) => {
      return response.status(200).send({ article: article });
    })
    .catch(next);
};

const getCommentsByArticleId = (request, response, next) => {
  const { article_id } = request.params;
  const articlePromise = fetchArticlesById(article_id);
  articlePromise
    .then(() => {
      const commentsPromise = fetchCommentsByArticleId(article_id);
      commentsPromise
        .then((comments) => {
          return response.status(200).send({ comments: comments });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch(next);
};

const postCommentByArticleId = (request, response, next) => {
  const { article_id } = request.params;
  const { body, username } = request.body;
  insertCommentByArticleId(article_id, body, username)
    .then((comment) => {
      response.status(201).send({ comment });
    })
    .catch(next);
};

const patchArticleById = (request, response, next) => {
  const { article_id } = request.params;
  const { inc_votes } = request.body;
  updateArticleById(article_id, inc_votes)
    .then((article) => {
      response.status(200).send({ article });
    })
    .catch(next);
};

const deleteCommentById = (request, response, next) => {
  const { comment_id } = request.params;
  deletingCommentFromDb(comment_id)
    .then(() => {
      response.status(204).send();
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = {
  getArticlesById,
  getAllArticles,
  getCommentsByArticleId,
  postCommentByArticleId,
  patchArticleById,
  deleteCommentById,
};
