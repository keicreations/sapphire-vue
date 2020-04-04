# sapphire-vue

Sapphire Vue is a [Vue.js][vue-js] library to handle [Api Platform][api-platform] JSON-LD/Hydra resources. 

## Features

### Axios API wrapper for JWT authentication 
- Uses [Axios][axios] promises
- Anonymous and Authenticated calls
- Interceptor for automatically refreshing expired tokens

### Vuex store
- Authentication with [API Platform][api-platform]
- Authentication with [Mercure][mercure]
- Mercure handler registration
  - Uses a single Mercure connection 
  - Automatic connecting and reconnecting depending on the watched topics
- Fetches user data from the [JWT token][jwt]

### Vue ResourceList/ResourceGrid component 
- Holds a [Hydra:collection][hydra-collection]
- Uses [slots][vue-slot] for custom templating
- Can watch Mercure for crud operations
  - Configurable handlers per crud operation (create, update, delete)
  - Eventhandlers to intercept operations
  - Events after completed operations
- Server-side pagination
- Server-side filtering and ordering

## Usage

### Yarn
`yarn add @keicreations/vue-sapphire`

> Add a .npmrc file to the root of your project if you want to use Font Awesome Pro

[mercure]: https://mercure.rocks/docs/getting-started
[api-platform]: https://api-platform.com/docs/core/getting-started/
[vue-js]: https://vuejs.org/v2/guide/
[vue-slot]: https://vuejs.org/v2/guide/components-slots.html
[axios]: https://github.com/axios/axios
[hydra-collection]: https://www.hydra-cg.com/spec/latest/core/#collections
[jwt]: https://jwt.io/
