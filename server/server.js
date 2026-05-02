/* global process, console */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "SkillsDemo";

let db;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "50mb" }));

async function getDb() {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  db = client.db(MONGODB_DB);

  await db.collection("Tests").createIndex(
    { FeatureName: 1, TestName: 1 },
    { unique: true }
  );

  console.log(`Connected to MongoDB database: ${MONGODB_DB}`);

  return db;
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

app.get("/api/health", async (req, res) => {
  try {
    await getDb();

    res.json({
      status: "ok",
      message: "Backend is running",
      database: MONGODB_DB,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

app.post("/api/cart", (req, res) => {
  const item = req.body?.item;

  if (!item) {
    return res.status(400).json({
      success: false,
      message: "Item is required",
    });
  }

  return res.status(200).json({
    success: true,
    item,
    message: `${item} added to cart`,
  });
});

app.post("/api/test-results", async (req, res) => {
  try {
    const database = await getDb();

    const {
      buildId = `local-${Date.now()}`,
      executedAt = new Date().toISOString(),
      results = [],
    } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "results array is required",
      });
    }

    const savedResults = [];

    for (const result of results) {
      const featureName = result.FeatureName || result.featureName || "Unknown";
      const testName = result.TestName || result.testName || result.name || "Unknown";
      const passed = result.Result !== false;

      const commands = Array.isArray(result.commands) ? result.commands : [];

      const testDoc = await database.collection("Tests").findOneAndUpdate(
        {
          FeatureName: featureName,
          TestName: testName,
        },
        {
          $set: {
            FeatureName: featureName,
            TestName: testName,
            CurrentState: passed,
            DateCurrentRun: new Date(executedAt),
            DateLastRun: new Date(executedAt),
            OutcomeLastRun: passed,
          },
          $setOnInsert: {
            CreatedAt: new Date(),
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      const testResultDoc = {
        DateRan: new Date(executedAt),
        BuildId: buildId,
        TestId: testDoc._id,
        FeatureName: featureName,
        TestName: testName,
        Result: passed,
        ResolvedFailed: false,
        ResolvedDate: null,
        RootCause: "",
        Commands: commands.map((command, index) => ({
          index: index + 1,
          name: command.command || command.name || `Step ${index + 1}`,
          status: "passed",
          message: "",
          screenshotUrl: command.screenshotUrl || "",
          screenshotName: command.screenshotUrl
            ? path.basename(command.screenshotUrl)
            : "",
          imageId: null,
        })),
        Summary: {
          commandCount: commands.length,
          imageCount: 0,
          passed,
        },
      };

      const insertedRun = await database
        .collection("TestResults")
        .insertOne(testResultDoc);

      const testResultId = insertedRun.insertedId;
      const updatedCommands = [];

      for (const command of testResultDoc.Commands) {
        let imageId = null;

        if (command.screenshotUrl) {
          const relativePath = command.screenshotUrl.replace(/^\//, "");
          const imagePath = path.join(process.cwd(), "public", relativePath.replace("tempScreenshots/", "tempScreenshots/"));

          if (fs.existsSync(imagePath)) {
            const buffer = fs.readFileSync(imagePath);

            const insertedImage = await database.collection("Images").insertOne({
              TestResultsId: testResultId,
              TestId: testDoc._id,
              FeatureName: featureName,
              TestName: testName,
              StepIndex: command.index,
              Name: command.screenshotName,
              MimeType: "image/png",
              Size: buffer.length,
              Content: buffer,
              CreatedAt: new Date(),
            });

            imageId = insertedImage.insertedId;
          }
        }

        updatedCommands.push({
          ...command,
          imageId,
        });
      }

      await database.collection("TestResults").updateOne(
        { _id: testResultId },
        {
          $set: {
            Commands: updatedCommands,
            "Summary.imageCount": updatedCommands.filter((cmd) => cmd.imageId).length,
          },
        }
      );

      savedResults.push({
        testId: testDoc._id.toString(),
        testResultId: testResultId.toString(),
        FeatureName: featureName,
        TestName: testName,
      });
    }

    res.json({
      success: true,
      ok: true,
      savedResults,
    });
  } catch (error) {
    console.error("POST /api/test-results failed:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.get("/api/reporter/tests", async (req, res) => {
  try {
    const database = await getDb();

    const tests = await database
      .collection("Tests")
      .find({})
      .sort({ FeatureName: 1, TestName: 1 })
      .toArray();

    res.json({
      ok: true,
      tests: tests.map((test) => ({
        _id: test._id.toString(),
        FeatureName: test.FeatureName,
        TestName: test.TestName,
        CurrentState: test.CurrentState,
        DateCurrentRun: test.DateCurrentRun,
        DateLastRun: test.DateLastRun,
        OutcomeLastRun: test.OutcomeLastRun,
      })),
    });
  } catch (error) {
    console.error("GET /api/reporter/tests failed:", error);

    res.status(500).json({
      ok: false,
      message: error.message,
      tests: [],
    });
  }
});

app.get("/api/reporter/test-runs/:testId", async (req, res) => {
  try {
    const database = await getDb();
    const testObjectId = toObjectId(req.params.testId);

    if (!testObjectId) {
      return res.status(400).json({
        ok: false,
        message: "Invalid testId",
      });
    }

    const runs = await database
      .collection("TestResults")
      .find({ TestId: testObjectId })
      .sort({ DateRan: -1 })
      .toArray();

    res.json({
      ok: true,
      runs: runs.map((run) => ({
        _id: run._id.toString(),
        TestId: run.TestId?.toString(),
        FeatureName: run.FeatureName,
        TestName: run.TestName,
        DateRan: run.DateRan,
        BuildId: run.BuildId,
        Result: run.Result,
        Commands: Array.isArray(run.Commands)
          ? run.Commands.map((command) => ({
              ...command,
              imageId: command.imageId ? command.imageId.toString() : null,
            }))
          : [],
        Summary: run.Summary || {},
      })),
    });
  } catch (error) {
    console.error("GET /api/reporter/test-runs/:testId failed:", error);

    res.status(500).json({
      ok: false,
      message: error.message,
      runs: [],
    });
  }
});

app.get("/api/reporter/image/:imageId", async (req, res) => {
  try {
    const database = await getDb();
    const imageObjectId = toObjectId(req.params.imageId);

    if (!imageObjectId) {
      return res.status(400).json({
        ok: false,
        message: "Invalid imageId",
      });
    }

    const image = await database
      .collection("Images")
      .findOne({ _id: imageObjectId });

    if (!image || !image.Content) {
      return res.status(404).json({
        ok: false,
        message: "Image not found",
      });
    }

    res.setHeader("Content-Type", image.MimeType || "image/png");
    res.setHeader("Cache-Control", "no-store");

    res.send(image.Content.buffer || image.Content);
  } catch (error) {
    console.error("GET /api/reporter/image/:imageId failed:", error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

app.post("/api/reporter/report", async (req, res) => {
  try {
    const database = await getDb();

    const testObjectId = toObjectId(req.body.testId);
    const runIds = Array.isArray(req.body.runIds) ? req.body.runIds : [];

    if (!testObjectId) {
      return res.status(400).json({
        ok: false,
        message: "Valid testId is required",
      });
    }

    if (runIds.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Select at least one run",
      });
    }

    const runObjectIds = runIds.map(toObjectId).filter(Boolean);

    const test = await database.collection("Tests").findOne({
      _id: testObjectId,
    });

    const runs = await database
      .collection("TestResults")
      .find({
        _id: { $in: runObjectIds },
        TestId: testObjectId,
      })
      .sort({ DateRan: -1 })
      .toArray();

    res.json({
      ok: true,
      report: {
        generatedAt: new Date().toISOString(),
        test: test
          ? {
              _id: test._id.toString(),
              FeatureName: test.FeatureName,
              TestName: test.TestName,
            }
          : null,
        runs: runs.map((run) => {
          const commands = Array.isArray(run.Commands)
            ? run.Commands.map((command) => ({
                index: command.index,
                name: command.name,
                status: command.status,
                message: command.message,
                screenshotName: command.screenshotName,
                imageId: command.imageId ? command.imageId.toString() : null,
              }))
            : [];

          return {
            _id: run._id.toString(),
            featureName: run.FeatureName,
            testName: run.TestName,
            dateRan: run.DateRan,
            buildId: run.BuildId,
            result: run.Result,
            summary: {
              commandCount: commands.length,
              imageCount: commands.filter((command) => command.imageId).length,
              buildId: run.BuildId,
              dateRan: run.DateRan,
            },
            commands,
          };
        }),
      },
    });
  } catch (error) {
    console.error("POST /api/reporter/report failed:", error);

    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});