import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import NodeCache from "node-cache";
import winston from "winston";
import cors from "cors";

dotenv.config({
  path: "../.env",
});
const { Client: PgClient } = pg;

const app = express();
app.use(bodyParser.json());
app.use(cors());

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

const queryCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const pgClient = new PgClient({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASS,
  port: process.env.PG_PORT,
  schema: process.env.PG_SCHEMA,
});
pgClient.connect();

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getTableSchemas() {
  const schema = {};

  const { rows: tables } = await pgClient.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = $1 
     AND table_name != 'metadata'`,
    [process.env.PG_SCHEMA]
  );

  for (const { table_name } of tables) {
    const { rows: columns } = await pgClient.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = $1 
       AND table_name = $2`,
      [process.env.PG_SCHEMA, table_name]
    );

    schema[table_name] = columns.map((row) => row.column_name);
  }

  return schema;
}

function cleanSQLResponse(response) {
  return response.replace(/```sql\n?|```/g, "").trim();
}

async function processQuery(query) {
  try {
    if (queryCache.has(query)) {
      return queryCache.get(query);
    }

    const tableSchemas = await getTableSchemas();
    const schemaDescription = Object.entries(tableSchemas)
      .map(([table, columns]) => `Table **${table}**: ${columns.join(", ")}`)
      .join("\n");

    const prompt = `You are a SQL query generator for geospatial search tool.
     
      Important:
      - The tables are stored in the schema: **${process.env.PG_SCHEMA}**. 
      - Append the schema name to the table name when referencing columns.
      - Select all columns from a table using the wildcard character: **\***. Unless explicitly 
        redacted by the query below
      - For columns with numeric values, you can apply mathematical operations, modify the value to extract
        the values e.g width of a road, temperature range etc by using a regex or substring function. An exmple 
        is 'NULLIF(regexp_replace(width, '[^0-9\.]', '', 'g'), '')::decimal' to extract the width from a string
      - Cast the numerical columns to decimal or integer as necessary.


      The database contains the following tables:
      ${schemaDescription}


      Your task:
      - Convert the following natural language query into a PostgreSQL SQL Statement.
      - Ensure that it applies to the appropriate table.
      - The SQL Statement should dynamically filter based on relevant columns.
      - The database is PostGIS enabled, so you can use spatial functions.
      
      You may:
      - Join multiple tables if necessary by referencing the columns across the tables
        and joining related tables.
      - Remove any irrelevant table and column references.
      - Convert geom field from WKT, WKB to GeoJSON using ST_AsGeoJSON(geom) as geojson function. Ensure 
        to alias the column as geojson.
      
      Return the full SQL Query only as raw text. Remove language or code snippets or any other formatting.
      Query: "${query}"`;

    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const sql = cleanSQLResponse(result.response.text());

    queryCache.set(query, sql);
    return sql;
  } catch (error) {
    logger.error("Error processing query:", error);
    throw error;
  }
}

app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    const sql = await processQuery(query);

    const { rows: postgresResults } = await pgClient.query(sql);

    res.json({ postgres: postgresResults });
  } catch (error) {
    logger.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
});
