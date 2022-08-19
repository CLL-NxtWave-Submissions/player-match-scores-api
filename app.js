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

/*
    End-Point 5: /players/:playerId/matches
    ------------
    To fetch details of matches played by
    specific player with id: playerId
*/
app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;

  const queryToFetchMatchDataForSpecificPlayer = `
    SELECT DISTINCT
        temp_player_match_details_score.match_id,
        temp_player_match_details_score.match,
        temp_player_match_details_score.year
    FROM
        ((player_details
        INNER JOIN 
            player_match_score
        ON 
            player_details.player_id = player_match_score.player_id) as temp_player_details_match_score
        INNER JOIN
            match_details
        ON
            temp_player_details_match_score.match_id = match_details.match_id) AS temp_player_match_details_score
    WHERE
        temp_player_match_details_score.player_id = ${playerId};
    `;

  const matchesDataOfSpecificPlayer = await cricketMatchDetailsDBConnectionObj.all(
    queryToFetchMatchDataForSpecificPlayer
  );
  const processedMatchesDataOfSpecificPlayer = matchesDataOfSpecificPlayer.map(
    (singleMatchData) => ({
      matchId: singleMatchData.match_id,
      match: singleMatchData.match,
      year: singleMatchData.year,
    })
  );

  res.send(processedMatchesDataOfSpecificPlayer);
});

/*
    End-Point 6: /matches/:matchId/players
    ------------
    To fetch data of players that played
    in a specific match with id: matchId
*/
app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;

  const queryToFetchPlayerDataOfSpecificMatch = `
    SELECT DISTINCT
        temp_player_match_details_score.player_id,
        temp_player_match_details_score.player_name
    FROM
        ((match_details
            INNER JOIN 
                player_match_score
            ON 
                match_details.match_id = player_match_score.match_id) 
                AS temp_match_details_player_score
                    INNER JOIN 
                        player_details
                    ON 
                        temp_match_details_player_score.player_id = player_details.player_id)
                        AS temp_player_match_details_score
    WHERE
            temp_player_match_details_score.match_id = ${matchId};
    `;

  const playersDataOfSpecificMatch = await cricketMatchDetailsDBConnectionObj.all(
    queryToFetchPlayerDataOfSpecificMatch
  );
  const processedPlayersDataOfSpecificMatch = playersDataOfSpecificMatch.map(
    (singlePlayerData) => ({
      playerId: singlePlayerData.player_id,
      playerName: singlePlayerData.player_name,
    })
  );

  res.send(processedPlayersDataOfSpecificMatch);
});

/*
    End-Point 7: /players/:playerId/playerScores
    ------------
    To fetch aggregated player scores along with
    player data for a specific player with id: playerId
*/
app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;

  const queryToGetAggregatedPlayerScoresForSpecificPlayer = `
    SELECT
        temp_player_details_match_score.player_id,
        temp_player_details_match_score.player_name,
        SUM(temp_player_details_match_score.score) AS total_score,
        SUM(temp_player_details_match_score.fours) AS total_fours,
        SUM(temp_player_details_match_score.sixes) AS total_sixes
    FROM
        (player_details
            INNER JOIN
                player_match_score
            ON
                player_details.player_id = player_match_score.player_id) AS temp_player_details_match_score
    WHERE
            temp_player_details_match_score.player_id = ${playerId};
    `;

  const aggregatedPlayerStatsDataForSpecificPlayer = await cricketMatchDetailsDBConnectionObj.get(
    queryToGetAggregatedPlayerScoresForSpecificPlayer
  );
  const processedAggregatedPlayerStatsDataForSpecificPlayer = {
    playerId: aggregatedPlayerStatsDataForSpecificPlayer.player_id,
    playerName: aggregatedPlayerStatsDataForSpecificPlayer.player_name,
    totalScore: aggregatedPlayerStatsDataForSpecificPlayer.total_score,
    totalFours: aggregatedPlayerStatsDataForSpecificPlayer.total_fours,
    totalSixes: aggregatedPlayerStatsDataForSpecificPlayer.total_sixes,
  };

  res.send(processedAggregatedPlayerStatsDataForSpecificPlayer);
});

module.exports = app;
