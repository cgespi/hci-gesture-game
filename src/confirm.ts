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
const raw = sessionStorage.getItem('gameSettings')

if (raw) {
  try {
    const s = JSON.parse(raw)
    if (details) {
      details.innerHTML = `
        <p>Gamemode: ${s.gamemode}</p>
        <p>Difficulty: ${s.difficulty}</p>
        <p>Difficulty Growth Speed: ${s.difficultyGrowthSpeed}</p>
      `} 
  } catch (e) {
    if (details) details.textContent = '(no saved settings)'
  }
} else {
  if (details) details.textContent = '(no saved settings)'
}

const back = document.getElementById('back') as HTMLButtonElement | null
if (back) back.onclick = () => (window.location.href = '/')
