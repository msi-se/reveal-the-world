<template>
  <main>
    <div style="height: 90vh; width: 90vw">
      <l-map
        :center="[47.41322, -1.219482]"
        :zoom="5"
        @click="onClickOnMap"
        :min-zoom="1"
        :max-zoom="10"
        :zoom-animation="true"
        style="cursor: crosshair"
      >
        <l-tile-layer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          min-zoom="1"
          max-zoom="14"
          inertia-max-speed="500"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        />
        <l-polygon
          v-for="polygon in polygons"
          :key="polygon.key"
          :lat-lngs="polygon.latlngs"
          :color="polygon.color"
          :weight="0"
          :fill-opacity="polygon.opacity"
          :fill="true"
          :fill-color="polygon.color"
        />
      </l-map>
    </div>
  </main>
</template>
<script>
import { LMap, LTileLayer, LControlLayers, LRectangle, LPolygon } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"
import * as requests from "../js/requests.js"

export default {
  components: {
    LMap,
    LTileLayer,
    LPolygon
  },
  data() {
    return {
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      },
      /** @type {Array<{key: number, latlngs: number[][], color: string , opacity: number}>} */
      polygons: []
    }
  },
  computed: {},
  methods: {
    async onClickOnMap(event) {
      const { lat, lng } = event.latlng || {}
      if (isNaN(lat) || isNaN(lng)) return;
      
      console.log("clicked on map", lat, lng);
      let newHeatRegions = await requests.createHeatRegionPin({ longitude: lng, latitude: lat })
      console.log("newHeatRegions", newHeatRegions);
      this.updateHeatRegions(newHeatRegions)
    },
    async fetchHeatRegions() {
      let heatRegions = await requests.getHeatRegions()
      return heatRegions
    },
    async updateHeatRegions(heatRegions) {

      console.log("updateHeatRegions", heatRegions);

      const getDesityColorForFloat = (float) => {
        const densityColors = [
          "#1d4877",
          "#1b8a5a",
          "#fbb021",
          "#f68838",
          "#ee3e32",
        ]
        const index = Math.floor(float * densityColors.length);
        return densityColors[index];
      }

      // compute density
      const maxCount = heatRegions.reduce((max, region) => { return Math.max(max, region.count) }, 0)
      heatRegions = heatRegions.map((region) => {
        return {
          ...region,
          density: region.count / maxCount
        }
      })
      console.log("heatRegions", heatRegions);

      // create polygons
      heatRegions.forEach((region) => {
        const polygon = {
          key: region.polygonname,
          latlngs: region.polygon,
          color: getDesityColorForFloat(region.density),
          opacity: 1 //region.density
        }
        this.polygons.push(polygon)
      })

      console.log("this.polygons", this.polygons);
    }
  },
  async mounted() {
    const heatRegions = await this.fetchHeatRegions()
    this.updateHeatRegions(heatRegions)
  }

}
</script>
