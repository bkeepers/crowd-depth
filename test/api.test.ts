import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import express from "express";
import nock from "nock";
import { createApi, createIdentity } from "../src/api";
import { getMetadata } from "../src";
import { config, vessel } from "./helper";

// This is a real response from NOAA for a valid submission
const SUCCESS_RESPONSE = {
  success: true,
  message: "Submission successful.",
  submissionIds: ["123"],
};

const app = express();
app.use(
  createApi({
    url: "https://example.com/bathy",
    token: "test-token",
  }),
);

beforeAll(() => {
  nock.enableNetConnect("127.0.0.1");
});

describe("POST /xyz", () => {
  test("rejects requests without token", async () => {
    await request(app)
      .post("/xyz")
      .expect(401)
      .expect({ success: false, message: "No token provided" });
  });

  test("rejects requests with malformed token", async () => {
    await request(app)
      .post("/xyz")
      .set("Authorization", "malformed-token")
      .expect(401)
      .expect({ success: false, message: "No token provided" });
  });

  test("rejects requests with invalid token", async () => {
    await request(app)
      .post("/xyz")
      .set("Authorization", "Bearer invalid-token")
      .expect(403)
      .expect({ success: false, message: "Invalid token" });
  });

  test("rejects requests with missing data", async () => {
    await request(app)
      .post("/xyz")
      .set("Authorization", `Bearer ${createIdentity(vessel.uuid).token}`)
      .expect(400)
      .expect({ success: false, message: "Missing Content-Type" });
  });

  test("rejects request with mismatched uuid", async () => {
    const metadata = getMetadata(vessel, config);
    const { token } = createIdentity("WRONG");

    await request(app)
      .post("/xyz")
      .set("Authorization", `Bearer ${token}`)
      .field("metadataInput", JSON.stringify(metadata), {
        filename: "test.json",
        contentType: "application/json",
      })
      .field("file", "dummy data", {
        filename: "test.xyz",
        contentType: "application/csv",
      })
      .expect(403)
      .expect({ success: false, message: "Invalid uniqueID" });
  });

  test("proxies to NOAA with valid token", async () => {
    const scope = nock("https://example.com")
      .post("/xyz")
      .matchHeader("x-auth-token", "test-token")
      .matchHeader("authorization", (val) => !val) // Ensure Authorization header is removed
      .reply(200, SUCCESS_RESPONSE, { "Content-Type": "application/json" });

    const metadata = getMetadata(vessel, config);

    await request(app)
      .post("/xyz")
      .set("Authorization", `Bearer ${createIdentity(vessel.uuid).token}`)
      .field("metadataInput", JSON.stringify(metadata), {
        filename: "test.json",
        contentType: "application/json",
      })
      .field("file", "dummy data", {
        filename: "test.xyz",
        contentType: "application/csv",
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .expect(SUCCESS_RESPONSE);

    expect(scope.isDone()).toBe(true);
  });

  test("also stores metadata and csv to S3-compatible endpoint", async () => {
    const bucket = "test-bucket";
    const endpoint = "https://s3.example.com";

    // Point storage at our mocked S3 endpoint
    process.env.S3_ENDPOINT = endpoint;
    process.env.S3_REGION = "us-east-1";
    process.env.S3_ACCESS_KEY_ID = "test-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret";
    process.env.S3_BUCKET = bucket;

    const metadata = getMetadata(vessel, config);

    // Mock NOAA endpoint
    const noaaScope = nock("https://example.com")
      .post("/xyz")
      .matchHeader("x-auth-token", "test-token")
      .reply(200, SUCCESS_RESPONSE, { "Content-Type": "application/json" });

    // Mock S3 PUT requests - AWS SDK signs and uses specific paths
    // We need to be lenient with the matching since AWS SDK adds auth headers
    const s3Scope = nock(endpoint)
      .filteringPath(() => "/")
      .put("/")
      .times(2) // Expect 2 PUT calls (JSON and CSV)
      .reply(200);

    // Create an app instance AFTER env vars are set, so storage picks them up
    const app2 = express();
    app2.use(
      createApi({ url: "https://example.com/bathy", token: "test-token" }),
    );

    await request(app2)
      .post("/xyz")
      .set("Authorization", `Bearer ${createIdentity(vessel.uuid).token}`)
      .field("metadataInput", JSON.stringify(metadata), {
        filename: "test.json",
        contentType: "application/json",
      })
      .field("file", "dummy data", {
        filename: "test.xyz",
        contentType: "application/csv",
      })
      .expect(200)
      .expect(SUCCESS_RESPONSE);

    expect(noaaScope.isDone()).toBe(true);
    expect(s3Scope.isDone()).toBe(true);
  });
});

describe("POST /identify", () => {
  test("returns a token", async () => {
    await request(app)
      .post("/identify")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("uuid");
        expect(res.body).toHaveProperty("token");
      });
  });
});
