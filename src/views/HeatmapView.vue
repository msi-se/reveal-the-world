<template>
  <main>
    <div style="height: 90vh; width: 90vw">
      <l-map
        :center="[47.41322, -1.219482]"
        :zoom="5"
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
      </l-map>
    </div>
  </main>
</template>
<script>
import { LMap, LTileLayer, LControlLayers, LRectangle, LPolygon } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"
import DataInputDialog from "../components/DataInputDialog.vue"
import { getOutlineForLatLng, getRandomPastelColor } from "../js/helpers.js"
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
    }
  },
  computed: {},
  methods: {
  }
}
</script>
