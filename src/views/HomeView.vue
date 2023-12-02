<template>
  <main>
    <input
      v-if="!isLoggedIn"
      type="text"
      placeholder="Login"
      v-model="login"
      @keyup.enter="loginUser"
    />
    <div v-if="isLoggedIn">
      <div>Logged in as {{ login }}</div>
      <button @click="logoutUser">Logout</button>
    </div>
    <DataInputDialog v-if="clickedOnMap" @save="saveData" @cancel="cancelData" />
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
  </main>
</template>
<script>
import { LMap, LTileLayer, LControlLayers, LRectangle, LPolygon } from "@vue-leaflet/vue-leaflet"
import "leaflet/dist/leaflet.css"
import DataInputDialog from "../components/DataInputDialog.vue"
import { getOutlineForLatLng, getRandomPastelColor } from "../js/helpers.js"
import { getPolygonAndName } from "../js/helpers-new.js"
import * as requests from "../js/requests.js"

export default {
  components: {
    LMap,
    LTileLayer,
    LPolygon,
    DataInputDialog
  },
  data() {
    return {
      /** @type {Array<{key: number, latlngs: number[][], color: string}>} */
      polygons: [],
      /** @type {Array<{key: number, latlng: number[]}>} */
      markers: [],
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      },
      isLoggedIn: false,
      login: "",
      clickedOnMap: false,
      selectedCoords: { lat: 0, lng: 0 }
    }
  },
  computed: {},
  methods: {
    /**
     * Triggered when the user clicks on the map
     * @param {L.LeafletMouseEvent} event
     */
    async onClickOnMap(event) {
      const { lat, lng } = event.latlng || {}
      if (isNaN(lat) || isNaN(lng)) return

      console.log(`click event on map at lat: ${lat}, lng: ${lng}`)

      this.clickedOnMap = true
      this.selectedCoords = { lat, lng }
    },
    /**
     * Triggered when the user clicks on the login input
     */
    async loginUser() {
      if (this.login.length > 0) {
        requests.createUser({ name: this.login, age: 0, homeLocation: "" })
        this.isLoggedIn = true
        localStorage.setItem("login", this.login)

        this.markers = []
        this.polygons = []

        await this.updatePinsAndPolygons()
      }
    },
    /**
     * Triggered when the user clicks on the logout button
     */
    logoutUser() {
      this.isLoggedIn = false
      this.login = ""
      localStorage.removeItem("login")
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
      console.log("saveData", data)

      const { lat, lng } = this.selectedCoords
      const saveResponse = await requests.createPin({
        username: this.login,
        name: data.name,
        description: data.description,
        date: data.date,
        companions: data.companions,
        duration: data.duration,
        budget: data.budget,
        latitude: lat,
        longitude: lng
      })

      // add the marker
      this.markers.push({
        key: this.markers.length + 1,
        latlng: [lat, lng]
      })

      // add also the polygon (returned by the post request)
      console.log("saveResponse", saveResponse)
      let polygonLatlngs = saveResponse.polygon;
      this.polygons.push({
        key: this.polygons.length + 1,
        latlngs: polygonLatlngs,
        color: getRandomPastelColor()
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
      const pins = await requests.getPinsOfUser(this.login)
      pins.forEach((pin) => {
        this.markers.push({
          key: this.markers.length + 1,
          latlng: [pin.latitude, pin.longitude]
        })
      })

      // fetch the outline for the pins
      pins.forEach(async (pin) => {
        const polygonLatlngs = pin.polygon
        this.polygons.push({
          key: this.polygons.length + 1,
          latlngs: polygonLatlngs,
          color: getRandomPastelColor()
        })
      })
    }
  },
  async mounted() {
    const login = localStorage.getItem("login")
    console.log("login", login)
    if (login) {
      const user = await requests.getUser(login)
      console.log("user", user)
      this.login = login
      this.isLoggedIn = true

      await this.updatePinsAndPolygons()
    }
  }
}
</script>
