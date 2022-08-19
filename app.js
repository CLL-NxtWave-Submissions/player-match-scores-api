const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const cricketMatchDetailsDataFilePath = path.join(
  __dirname,
  "cricketMatchDetails.db"
);
const sqliteDriver = sqlite3.Database;

let cricketMatchDetailsDBConnectionObj = null;

const initializeDBAndServer = async () => {
  try {
    cricketMatchDetailsDBConnectionObj = await open({
      filename: cricketMatchDetailsDataFilePath,
      driver: sqliteDriver,
    });

    app.listen(3000, () => {
      console.log("Server running and listening on port 3000 !");
    });
  } catch (exception) {
    console.log(`Error initializing DB or Server: ${exception.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
