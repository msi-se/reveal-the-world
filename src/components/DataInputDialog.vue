<template>
  <div class="floating-dialog">
    <input
      type="text"
      v-model="name"
      placeholder="Name of the trip ('Wien 2013')"
      style="width: 100%;"
    >
    <input
      type="text"
      v-model="description"
      placeholder="Tell us about your trip (Description)"
      style="width: 100%;"
    >
    <input
      type="date"
      v-model="date"
      placeholder="When did you go there? (Date)"
      style="width: 100%;"
    >
    <input
      type="text"
      v-model="companions"
      placeholder="How many people were with you? (0 if alone)"
      style="width: 100%;"
    >
    <input
      type="text"
      v-model="duration"
      placeholder="How long did you stay? (in days)"
      style="width: 100%;"
    >
    <input
      type="text"
      v-model="budget"
      placeholder="How much did you spend? (in €)"
      style="width: 100%;"
    >
    <button @click="cancel">
      Cancel
    </button>
    <button @click="save">
      Save
    </button>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {},
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
  methods: {
    cancel() {
      this.$emit('cancel')
    },
    save() {
      this.$emit('save', {
        name: this.name,
        description: this.description,
        date: this.date,
        companions: this.companions,
        duration: this.duration,
        budget: this.budget
      })
    }
  }
  

}
</script>

<style scoped>

/* should float in the middle */
.floating-dialog {
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
