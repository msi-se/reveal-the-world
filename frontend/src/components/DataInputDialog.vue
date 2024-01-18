<template>
  <div class="floating-dialog">
    <v-text-field
      variant="solo-filled"
      type="text"
      v-model="name"
      label="Name of the trip ('Wien 2013')"
    ></v-text-field>
    <v-text-field
      variant="solo-filled"
      type="text"
      v-model="description"
      label="Tell us about your trip (Description)"
    ></v-text-field>
    <v-text-field
      variant="solo-filled"
      type="date"
      v-model="date"
      label="When did you go there? (Date)"
    ></v-text-field>
    <v-text-field
      variant="solo-filled"
      type="text"
      v-model="companions"
      label="How many people were with you? (0 if alone)"
    ></v-text-field>
    <v-text-field
      variant="solo-filled"
      type="text"
      v-model="duration"
      label="How long did you stay? (in days)"
    ></v-text-field>
    <v-text-field
      variant="solo-filled"
      type="text"
      v-model="budget"
      label="How much did you spend? (in €)"
    ></v-text-field>
    <v-btn @click="$emit('cancel')" class="mr-4"> Cancel </v-btn>
    <v-btn
      @click="
        $emit('save', {
          name: this.name,
          description: this.description,
          date: this.date,
          companions: this.companions,
          duration: this.duration,
          budget: this.budget
        })
      "
      color="primary"
    >
      Save
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  emits: ['cancel', 'save'],
  data() {
    return {
      name: '',
      description: '',
      date: '',
      companions: '',
      duration: '',
      budget: ''
    }
  },
  methods: {}
}
</script>

<style scoped>
/* should float in the middle */
.floating-dialog {
  width: min(90vw, 500px);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.5);
  z-index: 100000;
}
</style>
