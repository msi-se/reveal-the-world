<template>
  <main>
    <div v-if="!isLoggedIn">

      <v-alert type="warning" :value="true">
        You have to login to see your travel pins...
      </v-alert>
      <input
        type="text"
        placeholder="Username"
        v-model="username"
        @keyup.enter="loginUser"
      />
      <input
        type="password"
        placeholder="Password"
        v-model="password"
        @keyup.enter="loginUser"
      />
      <button @click="loginUser">Login</button>
    </div>

    <div v-if="isLoggedIn">
      <div>Logged in as {{ username }}</div>
      <button @click="logoutUser">Logout</button>
    </div>
    <DataInputDialog v-if="clickedOnMap" @save="saveData" @cancel="cancelData" />
    <div v-if="isLoggedIn" style="height: 90vh; width: 90vw">
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
      /** @type {Array<{key: number, latlngs: number[][], color: string, polygonname: string}>} */
      polygons: [],
      /** @type {Array<{key: number, latlng: number[]}>} */
      markers: [],
      tileLayerOptions: {
        maxZoom: 18,
        minZoom: 1
      },
      isLoggedIn: false,
      username: "",
      password: "",
      token: "",
      clickedOnMap: false,
      selectedCoords: { lat: 0, lng: 0 }
    }
  },
  computed: {},
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
     * Triggered when the user clicks on the login input
     */
    async loginUser() {
      if (this.username && this.password) {

        const token = await requests.login({
          username: this.username,
          password: this.password
        });

        if (!token) {
          alert("Login failed")
          return
        }

        // store the jwt token in the local storage
        localStorage.setItem("jwt", token)
        localStorage.setItem("username", this.username)

        // update the state
        this.token = token
        this.isLoggedIn = true

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
      localStorage.removeItem("jwt")
      localStorage.removeItem("username")
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
        username: this.username,
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
        color: getRandomPastelColor(),
        polygonname: saveResponse.polygonname
      })
      this.clickedOnMap = false;
    },
    /**
     * Cancels the DataInputDialog
     */
    cancelData() {
      this.clickedOnMap = false;
    },
    async updatePinsAndPolygons() {
      this.markers = []
      this.polygons = []

      // fetch the pins for the logged in user and add them to the map
      const pins = await requests.getPinsOfUser(this.username, this.token)
      pins.forEach((pin) => {
        this.markers.push({
          key: this.markers.length + 1,
          latlng: [pin.latitude, pin.longitude]
        })
      })

      console.log("pins", pins)

      // create the polygons for the pins
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
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
    const token = localStorage.getItem("jwt")
    if (token) {

      const verificationResponse = await requests.verifyToken(token)
      const username = verificationResponse;
      this.token = token

      if (username) {
        this.isLoggedIn = true
        this.username = username
        await this.updatePinsAndPolygons()
      }

    }
  }
}
</script>
