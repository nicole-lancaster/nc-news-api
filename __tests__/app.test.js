const app = require("../app.js");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seeds/seed.js");
const {
  articleData,
  commentData,
  topicData,
  userData,
} = require("../db/data/test-data");

beforeEach(() => {
  return seed({ articleData, commentData, topicData, userData });
});

afterAll(() => {
  return db.end();
});

describe("ENDPOINT: /api/*", () => {
  test("GET 404: responds with 404 status code when user inputs a non-existent URL route", () => {
    return request(app)
      .get("/api/wrong-path")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid URL");
      });
  });
});

describe("ENDPOINT: /api/topics", () => {
  test("GET 200: should respond with an array of topic objects, each of which should have slug and description properties", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(({ body }) => {
        const { topics } = body;
        expect(topics).toBeInstanceOf(Array);
        expect(topics).toHaveLength(3);
        topics.forEach((topic) => {
          expect(topic).toEqual(
            expect.objectContaining({
              description: expect.any(String),
              slug: expect.any(String),
            })
          );
        });
      });
  });
});

describe("ENDPOINT: /api/articles", () => {
  test("GET 200: response with an array of article objects, with all the correct properties", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toHaveLength(12);
        expect(
          articles.forEach((article) => {
            expect(article).toMatchObject({
              author: expect.any(String),
              title: expect.any(String),
              article_id: expect.any(Number),
              topic: expect.any(String),
              created_at: expect.any(String),
              votes: expect.any(Number),
              article_img_url: expect.any(String),
              comment_count: expect.any(Number),
            });
          })
        );
      });
  });
  test("GET 200: responds with an array of article objects, correctly sorted by date (descending order)", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
  test("GET 200: responds with articles filtered by topic", () => {
    return request(app)
      .get("/api/articles?topic=cats")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toHaveLength(1);
        expect(
          articles.forEach((article) => {
            expect(article.topic).toBe("cats");
          })
        );
      });
  });
  test("GET 200: returns an empty array if the topic is valid but has no articles", () => {
    return request(app)
      .get("/api/articles?topic=paper")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toEqual([]);
      });
  });
  test("GET 200: responds with articles sorted by the chosen column name", () => {
    return request(app)
      .get("/api/articles?sort_by=author")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toHaveLength(12);
        expect(articles).toBeSortedBy("author");
      });
  });
  test("GET 200: responds with an array of article objects for a selected category query and correctly sorted into descending order,", () => {
    return request(app)
      .get("/api/articles?sort_by=votes&order=desc")
      .expect(200)
      .then(({ body }) => {
        const { articles } = body;
        expect(articles).toBeSortedBy("votes", {
          descending: true,
        });
      });
  });
  test("GET 400: responds with error message if trying to sort by a category that is not allowed,", () => {
    return request(app)
      .get("/api/articles?sort_by=article_img_url")
      .expect(400)
      .then(({ body }) => {
        const { msg } = body;
        expect(msg).toBe("Invalid sort by query");
      });
  });
});

describe("ENDPOINT: /api/articles/:article_id", () => {
  test("GET 200: should respond with a single (article) object, with all the correct properties", () => {
    return request(app)
      .get("/api/articles/9")
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: 9,
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: expect.any(Number),
          article_img_url: expect.any(String),
          comment_count: 2,
        });
      });
  });
  test("PATCH 200: accepts a request of an object with a vote increment property and a newVote number (value), and responds with the updated article object", () => {
    const requestBody = {
      inc_votes: -100,
    };
    return request(app)
      .patch("/api/articles/5")
      .send(requestBody)
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: 5,
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: -100,
          article_img_url: expect.any(String),
        });
      });
  });
  test("PATCH 200: updates a valid article with an existing vote count that isn't 0", () => {
    const requestBody = {
      inc_votes: -100,
    };
    return request(app)
      .patch("/api/articles/1")
      .send(requestBody)
      .expect(200)
      .then(({ body }) => {
        const { article } = body;
        expect(article).toMatchObject({
          author: expect.any(String),
          title: expect.any(String),
          article_id: 1,
          body: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String),
          votes: 0,
          article_img_url: expect.any(String),
        });
      });
  });

  test("GET 400: responds with 400 status code when user inputs an invalid article_id", () => {
    return request(app)
      .get("/api/articles/pineapple")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("GET 404: responds with 404 status code when user inputs a non-existent article number", () => {
    return request(app)
      .get("/api/articles/234234234")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Article ID does not exist");
      });
  });

  test("GET 404: responds with 404 status code when user inputs article_id of 0 (which is a num but doesn't exist)", () => {
    return request(app)
      .get("/api/articles/0")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Article ID does not exist");
      });
  });
  test("PATCH 400: responds with a 400 status code and error message if user inputs a valid article number but missing post body properties", () => {
    const requestBody = {};
    return request(app)
      .patch("/api/articles/1")
      .send(requestBody)
      .expect(400)
      .then((articleOrError) => {
        expect(articleOrError.body.msg).toBe(
          "Malformed body/missing required fields"
        );
      });
  });
  test("PATCH 400: responds with a 400 status code and error message if user inputs a valid article number but invalid post body property data types", () => {
    const requestBody = {
      inc_votes: "pineapple",
    };
    return request(app)
      .patch("/api/articles/4")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("PATCH 400: responds with a 400 status code and error message if user inputs a valid article number but invalid url param data types", () => {
    const requestBody = {
      inc_votes: 1,
    };
    return request(app)
      .patch("/api/articles/pineapple")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("PATCH 404: responds with 404 status code when user inputs a non-existent article number", () => {
    const requestBody = {
      inc_votes: 1,
    };
    return request(app)
      .patch("/api/articles/234234234")
      .send(requestBody)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Article ID does not exist");
      });
  });
});

describe("ENDPOINT: /api/articles/:article_id/comments", () => {
  test("GET 200: responds with an array of comments for the given article ID", () => {
    return request(app)
      .get("/api/articles/3/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeInstanceOf(Array);
        expect(comments).toHaveLength(2);
        comments.forEach((comments) => {
          expect(comments).toEqual(
            expect.objectContaining({
              comment_id: expect.any(Number),
              votes: expect.any(Number),
              created_at: expect.any(String),
              author: expect.any(String),
              body: expect.any(String),
              article_id: 3,
            })
          );
        });
      });
  });
  test("GET 200: responds with an array of comment objects, correctly sorted by date (descending order)", () => {
    return request(app)
      .get("/api/articles/3/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
  test("GET 200: responds with an empty array if article exists but there are no comments associated with that article ID", () => {
    return request(app)
      .get("/api/articles/2/comments")
      .expect(200)
      .then(({ body }) => {
        const { comments } = body;
        expect(comments).toEqual([]);
      });
  });

  test("GET 404: responds with 404 status code when user inputs an out of range article number", () => {
    return request(app)
      .get("/api/articles/9332879283/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Out of range for type integer - choose a smaller number"
        );
      });
  });
  test("GET 404: responds with 404 status code when user inputs a non-existent article number", () => {
    return request(app)
      .get("/api/articles/5667/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Article ID does not exist");
      });
  });
  test("GET 400: responds with 400 status code when user inputs an invalid article_id", () => {
    return request(app)
      .get("/api/articles/pineapple/comments")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("POST 201: accepts a request of an object with username and body property, and responds withthe posted comment object", () => {
    const requestBody = {
      username: "butter_bridge",
      body: "I am 100% sure that we're not completely sure.",
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(201)
      .then(({ body }) => {
        const { comment } = body;
        expect(comment).toMatchObject({
          comment_id: expect.any(Number),
          votes: 0,
          created_at: expect.any(String),
          author: "butter_bridge",
          body: "I am 100% sure that we're not completely sure.",
          article_id: 5,
        });
      });
  });
  test("POST 400: responds with a 400 status code and error message if user inputs a number that is out of range of request", () => {
    const requestBody = {
      username: "butter_bridge",
      body: "I am 100% sure that we're not completely sure.",
    };
    return request(app)
      .post("/api/articles/23423421123/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe(
          "Out of range for type integer - choose a smaller number"
        );
      });
  });

  test("POST 404: responds with a 404 status code and error message if user inputs an non existent article ID", () => {
    const requestBody = {
      username: "butter_bridge",
      body: "I am 100% sure that we're not completely sure.",
    };
    return request(app)
      .post("/api/articles/5432/comments")
      .send(requestBody)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe(
          'Key (article_id)=(5432) is not present in table "articles".'
        );
      });
  });

  test("POST 400: responds with a 400 status code and error message if user inputs an invalid article ID", () => {
    const requestBody = {
      username: "butter_bridge",
      body: "I am 100% sure that we're not completely sure.",
    };
    return request(app)
      .post("/api/articles/apples/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("POST 404: responds with a 400 status code and error message if user inputs a valid article number but missing post body properties", () => {
    const requestBody = {};
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Malformed body/missing required fields");
      });
  });

  test("POST 400: responds with a 400 status code and error message if user inputs a valid article number but missing post body.body property", () => {
    const requestBody = {
      username: "hi",
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Malformed body/missing required fields");
      });
  });

  test("POST 404 - Username not found", () => {
    const requestBody = {
      username: 5,
      body: 5,
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe(
          'Key (author)=(5) is not present in table "users".'
        );
      });
  });

  test("POST 404: responds with a 400 status code and error message if user inputs a valid article number but missing post body.username property", () => {
    const requestBody = {
      body: "hi",
    };
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Malformed body/missing required fields");
      });
  });

  test("POST 404: responds with a 400 status code and error message if user inputs a valid article number but undefined post body", () => {
    const requestBody = undefined;
    return request(app)
      .post("/api/articles/5/comments")
      .send(requestBody)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Malformed body/missing required fields");
      });
  });
});

describe("/api/comments/:comment_id", () => {
  test("DELETE 204: successfully deletes the given comment by comment_id and responds with a status 204 code and no content", () => {
    return request(app).delete("/api/comments/5").expect(204);
  });
  test("DELETE 400: responds with an error message when user inputs an invalid URL", () => {
    return request(app)
      .delete("/api/comments/pineapple")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
  test("DELETE 404: responds with an error message when user inputs a valid but non-existent comment ID", () => {
    return request(app)
      .delete("/api/comments/1208")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Comment does not exist");
      });
  });
});

describe("ENDPOINT: /api/users", () => {
  test("GET 200: response with an array of article objects, with all the correct properties", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        const { users } = body;
        expect(users).toHaveLength(4);
        expect(
          users.forEach((user) => {
            expect(user).toMatchObject({
              username: expect.any(String),
              name: expect.any(String),
              avatar_url: expect.any(String),
            });
          })
        );
      });
  });
});
describe("ENDPOINT: /api", () => {
  test("GET 200: responds with a JSON object that describes each available endpoint for API", async () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then((result) => {
        expect(JSON.parse(result.text)).toEqual({
          "GET /api": {
            description:
              "serves up a json representation of all the available endpoints of the api",
          },
          "GET /api/topics": {
            description: "serves an array of all topics",
            exampleResponse: {
              topics: [
                {
                  slug: "coding",
                  description: "Code is love, code is life",
                },
                {
                  slug: "football",
                  description: "FOOTIE!",
                },
                {
                  slug: "cooking",
                  description: "Hey good looking, what you got cooking?",
                },
              ],
            },
          },
          "GET /api/articles": {
            description:
              "responds with an array of all articles with the newest dislpayed first if no queries present, also accepts queries to filter atricles by topic, and sort by author, date created, title, article ID, votes, comment count, asc or descending",
            queries: ["topic", "sort_by", "order"],
            exampleResponse: {
              articles: [
                {
                  article_id: 34,
                  title: "The Notorious MSG’s Unlikely Formula For Success",
                  topic: "cooking",
                  author: "grumpy19",
                  body: "The 'umami' craze has turned a much-maligned and misunderstood food additive into an object of obsession for the world’s most innovative chefs. But secret ingredient monosodium glutamate’s biggest secret may be that there was never anything wrong with it at all.",
                  created_at: "2020-11-22T11:13:00.000Z",
                  votes: 0,
                  article_img_url:
                    "https://images.pexels.com/photos/2403392/pexels-photo-2403392.jpeg?w=700&h=700",
                  comment_count: "11",
                },
                {
                  article_id: 12,
                  title: "The battle for Node.js security has only begun",
                  topic: "coding",
                  author: "tickle122",
                  body: "The founder of the Node Security Project says Node.js still has common vulnerabilities, but progress has been made to make it more secure. Appearing at the recent Node Community Convention in San Francisco, project founder Adam Baldwin, chief security officer at Web consulting company &yet, emphasized risks, protections, and progress. Baldwin sees four risks within the Node ecosystem pertinent to the enterprise: the code dependency tree, bugs, malicious actors, and people. I think of [the dependency tree] more as the dependency iceberg, to be honest, Baldwin said, where your code is the ship and your dependencies that you have with your packaged JSON is that little tiny iceberg at the top. But developers need to be aware of the massive iceberg underneath, he stressed.",
                  created_at: "2020-11-15T13:25:00.000Z",
                  votes: 0,
                  article_img_url:
                    "https://images.pexels.com/photos/10845119/pexels-photo-10845119.jpeg?w=700&h=700",
                  comment_count: "7",
                },
              ],
            },
          },
          "GET /api/articles/:article_id": {
            description: "serves an a single article object by it's ID",
            exampleResponse: {
              article: {
                article_id: 2,
                title:
                  "The Rise Of Thinking Machines: How IBM's Watson Takes On The World",
                topic: "coding",
                author: "jessjelly",
                body: "Many people know Watson as the IBM-developed cognitive super computer that won the Jeopardy! gameshow in 2011. In truth, Watson is not actually a computer but a set of algorithms and APIs, and since winning TV fame (and a $1 million prize) IBM has put it to use tackling tough problems in every industry from healthcare to finance. Most recently, IBM has announced several new partnerships which aim to take things even further, and put its cognitive capabilities to use solving a whole new range of problems around the world.",
                created_at: "2020-05-14T00:02:00.000Z",
                votes: 0,
                article_img_url:
                  "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?w=700&h=700",
              },
            },
          },
          "GET /api/articles/:article_id/comments": {
            description:
              "serves an array of comments for a particular article based on it's ID, ordered by default from newest to oldest comments",
            exampleResponse: {
              comments: [
                {
                  comment_id: 146,
                  body: "Soluta autem fuga non alias. Odit eligendi voluptas reiciendis repudiandae reiciendis doloribus adipisci qui consequuntur. Et dignissimos unde optio. Recusandae aspernatur eius error. Eos autem et iusto sunt fuga ipsam omnis voluptatem rerum.",
                  article_id: 4,
                  author: "jessjelly",
                  votes: 6,
                  created_at: "2020-10-12T11:23:00.000Z",
                },
                {
                  comment_id: 14,
                  body: "Iure quas est omnis porro. Est in est distinctio sequi consectetur rerum deserunt. Et et reiciendis. Consequatur distinctio sint porro neque molestiae.",
                  article_id: 4,
                  author: "weegembump",
                  votes: -4,
                  created_at: "2020-08-14T13:09:00.000Z",
                },
              ],
            },
          },
          "GET /api/comments/:comment_id": {
            description:
              "successfully deletes a comment based on the comment ID",
            exampleResponse: {
              "": {},
            },
          },
          "GET /api/users": {
            description: "serves an array of all topics",
            exampleResponse: {
              users: [
                {
                  username: "tickle122",
                  name: "Tom Tickle",
                  avatar_url:
                    "https://vignette.wikia.nocookie.net/mrmen/images/d/d6/Mr-Tickle-9a.png/revision/latest?cb=20180127221953",
                },
                {
                  username: "grumpy19",
                  name: "Paul Grump",
                  avatar_url:
                    "https://vignette.wikia.nocookie.net/mrmen/images/7/78/Mr-Grumpy-3A.PNG/revision/latest?cb=20170707233013",
                },
                {
                  username: "happyamy2016",
                  name: "Amy Happy",
                  avatar_url:
                    "https://vignette1.wikia.nocookie.net/mrmen/images/7/7f/Mr_Happy.jpg/revision/latest?cb=20140102171729",
                },
              ],
            },
          },
        });
      });
  });
});
