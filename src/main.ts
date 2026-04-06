import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

function renderMenu() {
  app.innerHTML = `
    <div>
      <h1>Gesture Game</h1>
      <div>
        <div>
          <button id="confirm" onclick="startClicked()">Start</button>
          <button id="settings" onclick="settingsClicked()">Settings</button>
        </div>
      </div>
      <p>Select an option to continue</p>
    </div>
  `
  ;(window as any).startClicked = () => (window.location.href = '/confirm.html')
  ;(window as any).settingsClicked = () => (window.location.href = '/settings.html')
}
renderMenu()
