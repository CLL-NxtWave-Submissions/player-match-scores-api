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

/*
    End-Point 1: GET /players
    ------------
    To fetch all player data from
    the player_details table
*/
app.get("/players", async (req, res) => {
  const queryToFetchAllPlayerData = `
    SELECT
        *
    FROM
        player_details;
    `;

  const allPlayerData = await cricketMatchDetailsDBConnectionObj.all(
    queryToFetchAllPlayerData
  );
  const processedPlayerData = allPlayerData.map((singlePlayerData) => ({
    playerId: singlePlayerData.player_id,
    playerName: singlePlayerData.player_name,
  }));

  res.send(processedPlayerData);
});

/*
    End-Point 2: /players/:playerId
    ------------
    To fetch specific player data
    from player_details table
*/
app.get("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;

  const queryToGetSpecificPlayerData = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};
    `;

  const specificPlayerData = await cricketMatchDetailsDBConnectionObj.get(
    queryToGetSpecificPlayerData
  );
  const processedPlayerData = {
    playerId: specificPlayerData.player_id,
    playerName: specificPlayerData.player_name,
  };

  res.send(processedPlayerData);
});

/*
    End-Point 3: PUT /players/:playerId
    ------------
    To update details of specific player
    in the table player_details, with 
    id: playerId
*/
app.put("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;

  const queryToUpdateSpecificPlayerData = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;

  await cricketMatchDetailsDBConnectionObj.run(queryToUpdateSpecificPlayerData);
  res.send("Player Details Updated");
});

/*
    End-Point 4: GET /matches/:matchId
    ------------
    To fetch data of specific match
    from the table match_details with
    id: matchId
*/
app.get("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;

  const queryToFetchSpecificMatchData = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `;

  const specificMatchData = await cricketMatchDetailsDBConnectionObj.get(
    queryToFetchSpecificMatchData
  );
  const processedMatchData = {
    matchId: specificMatchData.match_id,
    match: specificMatchData.match,
    year: specificMatchData.year,
  };

  res.send(processedMatchData);
});

module.exports = app;
