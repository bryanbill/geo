# AI-Powered Geospatial Search Tool

## Overview

This project is an AI-powered search tool for querying geospatial data using natural language. It makes spatial data accessible to non-GIS professionals by leveraging technologies such as **PostGIS** and **Natural Language Processing (NLP)**.

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (if running via Docker)
- **PostgreSQL with PostGIS**
- **Node.js** and **npm/yarn** (for backend and frontend development)
- **GDAL** (for handling geospatial formats)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/bryanbill/geo.git
   cd geo
   ```

2. Create a `.env` file based on `.env.example` and configure your database credentials.

```bash
cp .env.example .env
```

3. If running PostGIS using the `docker-compose.yml` file,  tart the services.

   ```bash
   docker-compose up --build
   ```

4. Ingest your data sources (see [Data Ingestion](scripts/readme.txt)).
Ensure `sources.txt` is properly formatted and run:

```bash
cd scripts && bash ingest.sh
```

5. Run the application:

   - Start the backend:

     ```bash
     cd backend
     npm install  # or yarn
     npm start
     ```

   - Start the frontend:

     ```bash
     cd client
     npm install  # or yarn
     npm start
     ```


### Running Queries

Once the ingestion is complete, you can query the geospatial data via the API (if backend is running):

```bash
curl -X GET "http://localhost:5000/search?query=roads in Kenya"
```

### Troubleshooting

- Ensure **PostGIS** is enabled in your PostgreSQL database.
- If `ogr2ogr` is not found, install **GDAL**:

  ```bash
  sudo apt install gdal-bin  # Ubuntu/Debian
  brew install gdal  # macOS
  ```

## Contributions

Feel free to open issues and contribute to this project!
