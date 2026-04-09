import './style.css'

const app = document.querySelector<HTMLElement>('#app')!

// Load existing settings or defaults
const stored = sessionStorage.getItem('gameSettings')
const settings = stored
  ? JSON.parse(stored): {//if no settings use defaults
      gamemode: 'standing',
      difficulty: 'medium',              
      difficultyGrowthSpeed: 0.1,        
    }

// Render UI
app.innerHTML = `
  <div>
    <h1>Settings</h1>
    <div class="card">
      <form id="settingsForm">

        <p>
          Gamemode:
          <select id="gamemode">
            <option value="standing" ${settings.gamemode === 'standing' ? 'selected' : ''}>Standing</option>
            <option value="sitting" ${settings.gamemode === 'sitting' ? 'selected' : ''}>Sitting</option>
          </select>
        </p>

        </p>

        <p>
          Difficulty:
          <select id="difficulty">
            <option value="easy"   ${settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${settings.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard"   ${settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
          </select>
        </p>

        <p>
          Difficulty Growth Speed:
          <input
            id="growthSpeed"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value="${settings.difficultyGrowthSpeed}"
          />
        </p>

        <button type="submit">Save</button>
        <button type="button" id="cancel">Cancel</button>

      </form>
    </div>
  </div>
`

// Handle form submission
const form = document.getElementById('settingsForm') as HTMLFormElement
form.addEventListener('submit', (e) => {
  e.preventDefault()//makes browser not constantly refresh

  const gamemodeElement = document.getElementById('gamemode') as HTMLSelectElement
  const difficultyElement = document.getElementById('difficulty') as HTMLSelectElement
  const growthElement = document.getElementById('growthSpeed') as HTMLInputElement

  const newSettings = {
    ...settings, //gets settings from above
    gamemode: gamemodeElement.value,
    difficulty: difficultyElement.value,
    difficultyGrowthSpeed: Number(growthElement.value),
  }

  sessionStorage.setItem('gameSettings', JSON.stringify(newSettings))
  window.location.href = '/confirm'
})

// Cancel button
const cancel = document.getElementById('cancel') as HTMLButtonElement
cancel.onclick = () => (window.location.href = '/')
