import './style.css'

const app = document.querySelector<HTMLElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Results</h1>
    <div class="card">
      <div id="details"></div>
      <div id="stats"></div>
      <br/>
      <button id="settingsButton">Edit Settings</button>
      <button id ="redo">Redo Game</button>
    </div>
  </div>
`
//input gamestate details
const details = document.getElementById('details') as HTMLElement | null
const settings = sessionStorage.getItem('gameSettings')
const stats = sessionStorage.getItem('gameStats')
if (settings) {
    const s = JSON.parse(settings)
    if (details) {
        details.innerHTML = `
        <p>Gamemode: ${s.gamemode}</p>
        <p>Difficulty: ${s.difficulty}</p>
        <p>Difficulty Growth Speed: ${s.difficultyGrowthSpeed}</p>
    `
    }
}
if (stats){
    const e = JSON.parse(stats)
    const statsText = document.getElementById('stats')
    if (statsText) {
        statsText.innerHTML = `
        <p>Hits: ${e.hits}</p>
        <p>Misses: ${e.misses}</p>
    `
    }
}



const settingsButton = document.getElementById('settingsButton') as HTMLButtonElement | null
if (settingsButton) settingsButton.onclick = () => (window.location.href = '/settings')

const redo = document.getElementById('redo') as HTMLButtonElement
redo.onclick = () => (window.location.href = '/confirm')
