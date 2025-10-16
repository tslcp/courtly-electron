const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script loaded')

contextBridge.exposeInMainWorld('courtly', {
  readDb: () => ipcRenderer.invoke('db:read'),
  writeDb: (patch) => ipcRenderer.invoke('db:write', patch),
  schedulePropose: (payload) => ipcRenderer.invoke('schedule:propose', payload),
  reservationValidate: (payload) => ipcRenderer.invoke('reservation:validate', payload),
})

console.log('window.courtly exposed to renderer')
