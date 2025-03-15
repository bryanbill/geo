#!/bin/bash

set -e

if ! command -v ogr2ogr &>/dev/null; then
    echo "Error: ogr2ogr not found. Please install GDAL."
    exit 1
fi

ENV=../.env

if [ ! -f $ENV ]; then
    echo "Error: .env file not found."
    exit 1
fi

set -a
source $ENV
set +a

if [[ -z "$PG_USER" || -z "$PG_PASS" || -z "$PG_HOST" || -z "$PG_PORT" || -z "$PG_DB" || -z "$PG_SCHEMA" ]]; then
    echo "Error: Missing PostgreSQL credentials in .env file."
    exit 1
fi

PG_CONN="PG:host=$PG_HOST port=$PG_PORT dbname=$PG_DB user=$PG_USER password=$PG_PASS"

SOURCE_FILE="sources.txt"
if [[ ! -s "$SOURCE_FILE" ]]; then
    echo "Error: Source file '$SOURCE_FILE' does not exist or is empty."
    exit 1
fi

TEMP_DIR=$(mktemp -d /tmp/ingest_XXXXXX)
echo "Using temp directory: $TEMP_DIR"

psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB" -c "CREATE SCHEMA IF NOT EXISTS $PG_SCHEMA;"

psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB" <<EOF
CREATE TABLE IF NOT EXISTS "$PG_SCHEMA".metadata (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    category TEXT,
    description TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

IFS=$'\n'
for line in $(cat "$SOURCE_FILE"); do

    [[ -z "$line" ]] && continue

    NAME=$(echo "$line" | awk '{print $1}')
    CATEGORY=$(echo "$line" | awk -F'"' '{print $2}')
    DESCRIPTION=$(echo "$line" | awk -F'"' '{print $4}')
    URL=$(echo "$line" | awk '{print $NF}')

    echo "Processing dataset: $NAME"
    echo "Category: $CATEGORY"
    echo "Description: $DESCRIPTION"
    echo "URL: $URL"

    FILE_PATH="$TEMP_DIR/$(basename "$URL")"

    echo "Downloading: $URL"
    curl -L --progress-bar -o "$FILE_PATH" "$URL"

    case "$FILE_PATH" in
    *.zip)
        unzip -o "$FILE_PATH" -d "$TEMP_DIR"
        FILE_PATH=$(find "$TEMP_DIR" -name "*.shp" -o -name "*.geojson" -o -name "*.csv" | head -n 1)
        ;;
    *.tar.gz)
        tar -xzf "$FILE_PATH" -C "$TEMP_DIR"
        FILE_PATH=$(find "$TEMP_DIR" -name "*.shp" -o -name "*.geojson" -o -name "*.csv" | head -n 1)
        ;;
    esac

    if [[ -z "$FILE_PATH" ]]; then
        echo "Error: No valid file found after extraction. Skipping."
        continue
    fi

    psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:$PG_PORT/$PG_DB" <<EOF
INSERT INTO "$PG_SCHEMA".metadata (name, category, description)
VALUES ('$NAME', '$CATEGORY', '$DESCRIPTION')
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    imported_at = CURRENT_TIMESTAMP;
EOF

    echo "Creating table: $PG_SCHEMA.$NAME"
    ogr2ogr -f PostgreSQL "$PG_CONN" "$FILE_PATH" -nln "$PG_SCHEMA.$NAME" \
        -lco GEOMETRY_NAME=geom -lco FID=id -lco PRECISION=NO \
        -nlt PROMOTE_TO_MULTI -overwrite

    echo "Dataset $PG_SCHEMA.$NAME imported successfully."
done

echo "Cleaning up..."
rm -rf "$TEMP_DIR"
echo "Ingestion complete."
