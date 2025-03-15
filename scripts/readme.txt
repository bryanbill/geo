You should probably read this before doing anything.

Importing all the datasets manually to PostGIS is gonna be a pain in
the **s. So, I wrote a script to automate the process.

`ingest.sh` is a bash script reading the input from sources.txt and
ingesting the data to PostGIS. 

The `sources.txt` file contains the metadata of the datasets. The format is:
```
<name> <category> <description> <url>
```

It uses `ogr2ogr` you need to have gdal installed.

Currently the script is a bit slow (it works though). It downloads the datasets
sequentially. You can speed it up by implementing parallel downloads and ingestion. 

I believe in you. 