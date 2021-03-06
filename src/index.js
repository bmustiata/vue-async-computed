const prefix = '_async_computed$'

const AsyncComputed = {
  install (Vue, options) {
    options = options || {}

    Vue.config
      .optionMergeStrategies
      .asyncComputed = Vue.config.optionMergeStrategies.computed

    Vue.mixin({
      beforeCreate () {
        const optionData = this.$options.data
        const newData = {}

        if (!this.$options.computed) this.$options.computed = {}

        Object.keys(this.$options.asyncComputed || {}).forEach(key => {
          const fn = this.$options.asyncComputed[key]
          const get = typeof fn === 'function' ? fn : fn.get,
                def = typeof fn.default === 'undefined' ? null : fn.default

          this.$options.computed[prefix + key] = get
          newData[key] = def
        })

        this.$options.data = function vueAsyncComputedInjectedDataFn () {
          const data = (
              (typeof optionData === 'function')
                ? optionData.call(this)
                : optionData
             ) || {}
          Object.keys(newData).forEach(key => { data[key] = newData[key] })
          return data
        }
      },
      created () {
        Object.keys(this.$options.asyncComputed || {}).forEach(key => {
          let promiseId = 0
          this.$watch(prefix + key, newPromise => {
            const thisPromise = ++promiseId
            newPromise.then(value => {
              if (thisPromise !== promiseId) return
              this[key] = value
            }).catch(err => {
              if (thisPromise !== promiseId) return

              if (options.errorHandler === false) return

              const handler = (options.errorHandler === undefined)
                ? console.error.bind(console, 'Error evaluating async computed property:')
                : options.errorHandler

              handler(err.stack)
            })
          }, { immediate: true })
        })
      }
    })
  }
}

export default AsyncComputed

// Auto install in dist mode
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(AsyncComputed)
}
