const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchData: (url) => fetch(url).then(res => res.json())
});