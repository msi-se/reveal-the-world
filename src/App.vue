<template>
  <div style="height: 100vh; width: 100vw">
    <l-map
      v-model="zoom"
      v-model:zoom="zoom"
      :center="[47.41322, -1.219482]"
      @move="log('move')"
      @click="onClickOnMap"
    >
      <l-tile-layer
        url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
        min-zoom="1"
        max-zoom="14"
        attribution="&copy; <a href=&quot;https://stadiamaps.com/&quot;>Stadia Maps</a>, &copy; <a href=&quot;https://openmaptiles.org/&quot;>OpenMapTiles</a> &copy; <a href=&quot;http://openstreetmap.org&quot;>OpenStreetMap</a> contributors"
      />
      <l-tile-layer
        url="https://tiles.stadiamaps.com/tiles/stamen_terrain_labels/{z}/{x}/{y}{r}.png"
        :options="tileLayerOptions"
        attribution="&copy; <a href=&quot;https://stadiamaps.com/&quot;>Stadia Maps</a>, &copy; <a href=&quot;https://openmaptiles.org/&quot;>OpenMapTiles</a> &copy; <a href=&quot;http://openstreetmap.org&quot;>OpenStreetMap</a> contributors"
      />
      <l-control-layers />"
      <!-- do a polygon for all polygon in the array -->
      <l-polygon
        v-for="(polygon, index) in polygons"
        :key="index"
        :lat-lngs="polygon.latlngs"
        :color="polygon.color"
        :weight="1"
        :fill-opacity="0.2"
        :fill="true"
        :fill-color="polygon.color"
      />
    </l-map>
  </div>
</template>
<script>
import {
  LMap,
  LTileLayer,
  LControlLayers,
  LPolygon
} from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
// @ts-ignore
import {
  getPlaceByNominatimData,
  getCoordsFromSearchText,
  saveObjectToLocalStorage,
  getObjectFromLocalStorage,
  formatAddressObject,
  findHumanPlaceName,
getOutlineForLatLng,
} from "./js/helpers.js";

export default {
  components: {
    LMap,
    LTileLayer,
    LControlLayers,
    LPolygon
  },
  data() {
    return {
      zoom: 2,
      iconWidth: 25,
      iconHeight: 40,
      polygons: [{
        key: 1,
        latlngs: [
          [47.41322, -1.219482],
          [47.41322, -1.219482],
        ],
        color: 'red',
      }],
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1,
      },
    };
  },
  computed: {
  },
  methods: {
    log(a) {
      console.log(a);
    },
    changeIcon() {
      this.iconWidth += 2;
      if (this.iconWidth > this.iconHeight) {
        this.iconWidth = Math.floor(this.iconHeight / 2);
      }
    },
    async onClickOnMap(event) {
      const { lat, lng } = event.latlng || {};
      if (isNaN(lat) || isNaN(lng)) return;

      console.log(`click event on map at lat: ${lat}, lng: ${lng}`);

      const polygonLatlngs = await getOutlineForLatLng(lat, lng);
      this.polygons.push({
        key: this.polygons.length + 1,
        latlngs: polygonLatlngs,
        color: 'red',
      });
      
    },
  },
};
</script>
