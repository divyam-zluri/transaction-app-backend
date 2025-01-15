import express from "express";
import request from "supertest";
import { uploadCSV } from "../../src/services/fileUpload.service";

const app = express();
app.post("/upload", uploadCSV, (req, res) => {
  res.status(200).json({ success: true, message: "File uploaded successfully" });
});

describe("File Upload Service", () => {
  it("should call next() and return 200 when the file is valid", (done) => {
    const validFile = {
      originalname: "test.csv",
      mimetype: "text/csv",
      buffer: Buffer.from("Date,Description,Amount,Currency\n2021-01-01,Test,100,USD"),
    };

    request(app)
      .post("/upload")
      .attach("file", validFile.buffer, { filename: validFile.originalname, contentType: validFile.mimetype })
      .expect(200) // Expect 200 OK response
      .expect((res) => {
        expect(res.body).toEqual({
          success: true,
          message: "File uploaded successfully",
        });
      })
      .end(done);
  });

  it("should reject a file with an invalid extension", (done) => {
    const invalidFile = {
      originalname: "test.txt",
      mimetype: "text/plain",
      buffer: Buffer.from("This is a test file."),
    };

    request(app)
      .post("/upload")
      .attach("file", invalidFile.buffer, { filename: invalidFile.originalname, contentType: invalidFile.mimetype })
      .expect(400) // Expect 400 Bad Request response
      .expect((res) => {
        expect(res.body).toEqual({
          success: false,
          message: "Only .csv files are allowed and must be less than 1MB!",
        });
      })
      .end(done);
  });

  it("should reject a CSV file that exceeds the size limit", (done) => {
    const largeFile = {
      originalname: "large.csv",
      mimetype: "text/csv",
      buffer: Buffer.alloc(2 * 1024 * 1024), // 2MB buffer exceeds the limit
    };

    request(app)
      .post("/upload")
      .attach("file", largeFile.buffer, { filename: largeFile.originalname, contentType: largeFile.mimetype })
      .expect(400) // Expect 400 Bad Request response
      .expect((res) => {
        expect(res.body).toEqual({
          success: false,
          message: "File too large",
        });
      })
      .end(done);
  });
});