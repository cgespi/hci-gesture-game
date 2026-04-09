import './style.css'

const app = document.querySelector<HTMLElement>('#app')!

app.innerHTML = `
  <div>
    <h1>Settings Confirmation</h1>
    <div class="card">
      <div id="details"></div>
      <br/>
      <button id="back">Back</button>
      <button id ="start">Start Game</button>
    </div>
  </div>
`
//input gamestate details
const details = document.getElementById('details') as HTMLElement | null
const settings = sessionStorage.getItem('gameSettings')

if (settings) {
    const s = JSON.parse(settings)
    if (details) {
      details.innerHTML = `
        <p>Gamemode: ${s.gamemode}</p>
        <p>Difficulty: ${s.difficulty}</p>
        <p>Difficulty Growth Speed: ${s.difficultyGrowthSpeed}</p>
      `} 
} else {
    const newSettings = {
    gamemode: 'standing',
    difficulty: 'medium',
    difficultyGrowthSpeed: 0.1,
  }
  if (details) {
      details.innerHTML = `
        <p>Gamemode: ${newSettings.gamemode}</p>
        <p>Difficulty: ${newSettings.difficulty}</p>
        <p>Difficulty Growth Speed: ${newSettings.difficultyGrowthSpeed}</p>
      `} 

  sessionStorage.setItem('gameSettings', JSON.stringify(newSettings))

}

const back = document.getElementById('back') as HTMLButtonElement | null
if (back) back.onclick = () => (window.location.href = '/')

const start = document.getElementById('start') as HTMLButtonElement
start.onclick = () => (window.location.href = '/game')
