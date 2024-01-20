<template>
  <LoadingIndicator v-if="isLoading" />
  <div style="height: 90vh; width: 100vw">
    <l-map
      :center="[47.41322, -1.219482]"
      :zoom="5"
      :min-zoom="1"
      :max-zoom="10"
      :zoom-animation="true"
      style="cursor: crosshair"
    >
      <l-tile-layer
        url="http://tile.openstreetmap.org/{z}/{x}/{y}.png"
        min-zoom="1"
        max-zoom="14"
        inertia-max-speed="500"
        attribution='&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      />
      <l-polygon
        v-for="polygon in polygons"
        :key="polygon.key"
        :lat-lngs="polygon.latlngs"
        :color="polygon.color"
        :weight="0"
        :fill-opacity="0.5"
        :fill="true"
        :fill-color="polygon.color"
        :smooth-factor="0"
      />
    </l-map>
  </div>
</template>
<script>
import { LMap, LTileLayer, LControlLayers, LRectangle, LPolygon } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import * as requests from '../js/requests.js'
import LoadingIndicator from '../components/LoadingIndicator.vue'

export default {
  components: {
    LMap,
    LTileLayer,
    LPolygon,
    LoadingIndicator
  },
  data() {
    return {
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      },
      /** @type {Array<{key: string, latlngs: number[][], color: string , opacity: number}>} */
      polygons: [],
      clickedOnPolygon: false,
      isLoading: true
    }
  },
  computed: {},
  methods: {
    async loadHeatRegions() {

      this.isLoading = true
      const getDesityColorForFloat = (float) => {
        let h = (1.0 - float) * 240
        return 'hsl(' + h + ', 100%, 50%)'
      }

      // get heat regions
      let heatmapData = await requests.getHeatmapData()
      console.log('heatmapData', heatmapData)
      if (!heatmapData) {
        return
      }

      // create the polygons
      let heatRegions = heatmapData.heatRegions
      this.polygons = []
      for (let i = 0; i < heatRegions.length; i++) {
        let region = heatRegions[i]
        const polygon = {
          key: region.polygonname,
          latlngs: region.polygon,
          color: getDesityColorForFloat(region.density),
          opacity: region.density
        }
        this.polygons.push(polygon)
      }

      console.table(this.polygons)

      this.isLoading = false
    }
  },
  async mounted() {
    this.loadHeatRegions()
  }
}
</script>
