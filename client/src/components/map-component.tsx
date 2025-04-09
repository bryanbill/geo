import type React from "react";
import { useEffect, useRef } from "react";
import "ol/ol.css";
import { Map as OlMap } from "ol";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Fill, Stroke, Style } from "ol/style";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./ui/context-menu";
import { useSearch } from "../context/search-context";
import { toast } from "sonner";
import CircleStyle from "ol/style/Circle";

const GeospatialMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);

  const { results } = useSearch();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map only once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new OlMap({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([36.8219, -1.2921]), // Default to Nairobi, Kenya
          zoom: 6,
        }),
      });
    }

    const map = mapInstanceRef.current;

    // Remove the previous vector layer if exists
    if (vectorLayerRef.current) {
      map.removeLayer(vectorLayerRef.current);
    }

    // Create a new vector source
    const vectorSource = new VectorSource();

    for (const result of results) {
      if (result.geojson) {
        const geojsonFormat = new GeoJSON();
        const feature = geojsonFormat.readFeature(
          typeof result.geojson === "string"
            ? result.geojson
            : JSON.stringify(result.geojson),
          {
            featureProjection: "EPSG:3857",
          }
        );

        if (feature) {
          if (Array.isArray(feature)) {
            for (const f of feature) {
              f.setProperties({
                ...result,
              });
            }
            vectorSource.addFeatures(feature);
          } else {
            feature.setProperties({
              ...result,
            });
            vectorSource.addFeature(feature);
          }
        }
      }
    }

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        if (feature?.getGeometry()?.getType() === "MultiLineString") {
          return new Style({
            stroke: new Stroke({
              color: "blue",
              width: 2,
            }),
          });
        }

        return new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: "red",
            }),
          }),
        });
      },
    });

    map.addLayer(vectorLayer);
    vectorLayerRef.current = vectorLayer;

    // zoom to the extent of the vector layer
    if (vectorSource.getFeatures().length) {
      map.getView().fit(vectorSource.getExtent(), {
        padding: [50, 50, 50, 50],
        duration: 1000,
        callback: () => {
          toast.success("Map zoomed to the search results");
        },
      });
    }

    map.once("click", (event) => {
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const properties = feature.getProperties();
        console.log(properties);
      });
    });

    return () => {
      map.removeLayer(vectorLayer);
      map.un("click", () => {});
    };
  }, [results.length]);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full">
        <div ref={mapRef} className="w-full h-full " />
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64">
        <ContextMenuItem inset>
          Send to Back
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          Bring Forward
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          Remove
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>Map Tools</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              Change Map Style
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />

        <ContextMenuCheckboxItem checked>
          Enable links
          <ContextMenuShortcut>⌘⇧L</ContextMenuShortcut>
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default GeospatialMap;
