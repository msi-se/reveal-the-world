<template>
  <div style="height: 100vh; width: 100vw">
    <l-map
      :center="[47.41322, -1.219482]"
      :zoom="5"
      @click="onClickOnMap"
      :min-zoom="1"
      :max-zoom="10"
      :zoom-animation="true"
    >
      <l-tile-layer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        min-zoom="1"
        max-zoom="14"
        inertia-max-speed="500"
        attribution="&copy; <a href=&quot;https://stadiamaps.com/&quot;>Stadia Maps</a>, &copy; <a href=&quot;https://openmaptiles.org/&quot;>OpenMapTiles</a> &copy; <a href=&quot;http://openstreetmap.org&quot;>OpenStreetMap</a> contributors"
      />
      <l-polygon
        v-for="polygon in polygons"
        :key="polygon.key"
        :lat-lngs="polygon.latlngs"
        :color="polygon.color"
        :weight="0"
        :fill-opacity="0.8"
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

import {
  getPlaceByNominatimData,
  getCoordsFromSearchText,
  saveObjectToLocalStorage,
  getObjectFromLocalStorage,
  formatAddressObject,
  findHumanPlaceName,
  getOutlineForLatLng,
getRandomPastelColor
} from "./js/helpers.js";

export default {
  components: {
    LMap,
    LTileLayer,
    LPolygon
  },
  data() {
    return {
      /** @type {Array<{key: number, latlngs: number[][], color: string}>} */
      polygons: [],
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      }
    };
  },
  computed: {},
  methods: {
    /**
     * Triggered when the user clicks on the map
     * @param {L.LeafletMouseEvent} event
     */
    async onClickOnMap(event) {
      const { lat, lng } = event.latlng || {};
      if (isNaN(lat) || isNaN(lng)) return;

      console.log(`click event on map at lat: ${lat}, lng: ${lng}`);

      // fetch the outline for the clicked region
      const polygonLatlngs = await getOutlineForLatLng(lat, lng);
      this.polygons.push({
        key: this.polygons.length + 1,
        latlngs: polygonLatlngs,
        color: getRandomPastelColor()
      });
    }
  }
};
</script>
