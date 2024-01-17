<template>
  <DataInputDialog v-if="clickedOnMap" @save="saveData" @cancel="cancelData" />
  <div style="height: 90vh; width: 100vw">
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
        v-for="marker in markers"
        :key="marker.key"
        :lat-lngs="[marker.latlng]"
        :color="'green'"
        :weight="5"
        :z-index-offset="100000"
        :fill="true"
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
import { LMap, LTileLayer, LControlLayers, LRectangle, LPolygon } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import DataInputDialog from '../components/DataInputDialog.vue'
import { getOutlineForLatLng, getRandomPastelColor } from '../js/helpers.js'
import { getPolygonAndName } from '../js/helpers-new.js'
import * as requests from '../js/requests.js'
import { getUser, login, logout } from '../js/user'

export default {
  components: {
    LMap,
    LTileLayer,
    LPolygon,
    DataInputDialog
  },
  data() {
    return {
      /** @type {Array<{key: number, latlngs: number[][], color: string, polygonname: string}>} */
      polygons: [],
      /** @type {Array<{key: number, latlng: number[]}>} */
      markers: [],
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      },
      clickedOnMap: false,
      selectedCoords: { lat: 0, lng: 0 }
    }
  },
  computed: {
    isLoggedIn() {
      return getUser() !== null
    },
    username() {
      return getUser().username
    }
  },
  methods: {
    /**
     * Triggered when the user clicks on the map
     * @param event
     */
    async onClickOnMap(event) {
      const { lat, lng } = event.latlng || {}
      if (isNaN(lat) || isNaN(lng)) return

      console.log(`click event on map at lat: ${lat}, lng: ${lng}`)

      this.clickedOnMap = true
      this.selectedCoords = { lat, lng }
    },
    /**
     * Saves the data from the DataInputDialog
     * @param {Object} data
     * @param {string} data.name
     * @param {string} data.description
     * @param {string} data.date
     * @param {string} data.companions
     * @param {string} data.duration
     * @param {string} data.budget
     */
    async saveData(data) {
      console.log('saveData', data)

      const { lat, lng } = this.selectedCoords
      const saveResponse = await requests.createPin(
        {
          name: data.name,
          description: data.description,
          date: data.date,
          companions: data.companions,
          duration: data.duration,
          budget: data.budget,
          latitude: lat,
          longitude: lng
        },
        this.token
      )

      // add the marker
      this.markers.push({
        key: this.markers.length + 1,
        latlng: [lat, lng]
      })

      // add also the polygon (returned by the post request)
      console.log('saveResponse', saveResponse)
      let polygonLatlngs = saveResponse.polygon
      this.polygons.push({
        key: this.polygons.length + 1,
        latlngs: polygonLatlngs,
        color: getRandomPastelColor(),
        polygonname: saveResponse.polygonname
      })
      this.clickedOnMap = false
    },
    /**
     * Cancels the DataInputDialog
     */
    cancelData() {
      this.clickedOnMap = false
    },
    async updatePinsAndPolygons() {
      this.markers = []
      this.polygons = []

      // fetch the pins for the logged in user and add them to the map
      const pins = await requests.getPins()
      pins.forEach((pin) => {
        this.markers.push({
          key: this.markers.length + 1,
          latlng: [pin.latitude, pin.longitude]
        })
      })

      console.log('pins', pins)

      // create the polygons for the pins
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i]
        const polygonLatlngs = pin.polygon
        this.polygons.push({
          key: this.polygons.length + 1,
          latlngs: polygonLatlngs,
          color: getRandomPastelColor(),
          polygonname: pin.polygonname
        })
      }
    }
  },
  async mounted() {
    await this.updatePinsAndPolygons()
  }
}
</script>
