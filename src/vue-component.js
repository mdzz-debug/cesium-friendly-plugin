/**
 * Vue Component for Cesium Viewer
 * Supports both Vue 2 and Vue 3
 */

import CesiumFriendlyPlugin from './index.js';

// Vue 2 component
const Vue2Component = {
  name: 'CesiumViewer',
  props: {
    cesium: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      viewer: null
    };
  },
  mounted() {
    this.initViewer();
  },
  beforeDestroy() {
    this.destroyViewer();
  },
  methods: {
    initViewer() {
      if (!this.cesium) {
        console.error('Cesium object is required');
        return;
      }

      // Create viewer
      this.viewer = new this.cesium.Viewer(this.$el, {
        terrainProvider: this.cesium.createWorldTerrain(),
        ...this.options
      });

      // Initialize plugin
      CesiumFriendlyPlugin.init(this.cesium, this.viewer);

      // Emit ready event
      this.$emit('ready', this.viewer);
    },
    destroyViewer() {
      if (this.viewer) {
        this.viewer.destroy();
        this.viewer = null;
      }
    }
  },
  render(h) {
    return h('div', {
      style: {
        width: '100%',
        height: '100%'
      }
    });
  }
};

// Vue 3 component
const Vue3Component = {
  name: 'CesiumViewer',
  props: {
    cesium: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['ready'],
  setup(props, { emit }) {
    let viewer = null;
    let containerId = `cesium-container-${Date.now()}`;

    const initViewer = (el) => {
      if (!props.cesium) {
        console.error('Cesium object is required');
        return;
      }

      if (!el) {
        console.error('Container element not found');
        return;
      }

      // Create viewer
      viewer = new props.cesium.Viewer(el, {
        terrainProvider: props.cesium.createWorldTerrain(),
        ...props.options
      });

      // Initialize plugin
      CesiumFriendlyPlugin.init(props.cesium, viewer);

      // Emit ready event
      emit('ready', viewer);
    };

    const destroyViewer = () => {
      if (viewer) {
        viewer.destroy();
        viewer = null;
      }
    };

    return {
      containerId,
      initViewer,
      destroyViewer
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initViewer(this.$el);
    });
  },
  beforeUnmount() {
    this.destroyViewer();
  },
  render(h) {
    return h('div', {
      style: {
        width: '100%',
        height: '100%'
      }
    });
  }
};

/**
 * Auto-detect Vue version and return appropriate component
 */
function getVueComponent(Vue) {
  const vueVersion = Vue.version ? parseInt(Vue.version.split('.')[0]) : 2;
  
  if (vueVersion === 3) {
    return Vue3Component;
  }
  return Vue2Component;
}

export { Vue2Component, Vue3Component, getVueComponent };

