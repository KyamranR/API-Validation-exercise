process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeAll(async () => {
  await db.query("DELETE FROM books");
  await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES ('1234567890', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up', 2017)`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /books", () => {
  test("Get a list of all books", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.body.books.length).toEqual(1);
    expect(res.body.books[0]).toHaveProperty("isbn");
  });
});

describe("POST /books", () => {
  test("Creates a new book", async () => {
    const res = await request(app).post("/books").send({
      isbn: "0987654321",
      amazon_url: "http://a.co/example",
      author: "John Doe",
      language: "english",
      pages: 300,
      publisher: "Example Publisher",
      title: "Test Book",
      year: 2020,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.book).toHaveProperty("isbn");
  });

  test("Returns an error for invalid data", async () => {
    const res = await request(app).post("/books").send({
      isbn: "1234567890",
      pages: "not-a-number",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.status).toBe(400);
  });
});

describe("GET /books/:id", () => {
  test("Gets a single book", async () => {
    const res = await request(app).get("/books/1234567890");
    expect(res.statusCode).toBe(200);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.isbn).toBe("1234567890");
  });

  test("Returns 404 for non-existing book", async () => {
    const res = await request(app).get("/books/0000000000");
    expect(res.statusCode).toBe(404);
  });
});

describe("PUT /books/:isbn", () => {
  test("Updates a book", async () => {
    const res = await request(app).put(`/books/1234567890`).send({
      isbn: "1234567890",
      amazon_url: "http://new-url.com",
      author: "New Author",
      language: "english",
      pages: 300,
      publisher: "New Publisher",
      title: "Updated Title",
      year: 2018,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.book.pages).toBe(300);
  });

  test("Returns an error for invalid update", async () => {
    const res = await request(app).put("/books/1234567890").send({
      amazon_url: "invalid-url",
      author: "John Doe",
      language: "english",
      pages: 300,
      publisher: "Example Publisher",
      title: "Test Book",
      year: 2020,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.status).toBe(400);
  });
});

describe("DELETE /books/:isbn", () => {
  test("Deletes a book", async () => {
    const res = await request(app).delete("/books/1234567890");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Book deleted");
  });

  test("Returns 404 for non-existing book", async () => {
    const res = await request(app).delete("/books/0000000000");
    expect(res.statusCode).toBe(404);
  });
});
