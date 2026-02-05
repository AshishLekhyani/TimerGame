# Timer Challenge Game

A fun and interactive React-based game where you test your internal clock! Try to stop the timer at the exact target time to earn the highest score.

## 🎮 Features

- **Multiple Difficulty Levels:** Choose from 'Easy' (1s), 'Not Easy' (5s), 'Getting Tough' (10s), and 'Pros Only' (15s).
- **Real-time Feedback:** The game tracks your accuracy down to the millisecond.
- **Dynamic Scoring:** Earn points based on how close you get to the target time.
- **Sleek UI:** Interactive cards, responsive timers, and a results modal for score visualization.
- **Player Profiles:** Personalize your challenge by setting your player name.

## 🚀 Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** React Hooks (`useState`, `useRef`, `useImperativeHandle`)
- **UI Components:** Clean CSS and React Portals for modals.

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/TimerGame.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd TimerGame
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
5. **Open your browser:**
   Navigate to `http://localhost:(port)` to start playing!

## 🛠️ Technical Highlights

This project serves as a demonstration of advanced React patterns and efficient state management. Key implementation details include:

- **Precise Timer Orchestration:** Leveraging `setInterval` and `clearInterval` within specialized hooks to maintain millisecond-accurate game loops.
- **Engineered Ref Management:** Strategic use of `useRef` to facilitate direct DOM interactions and maintain persistent state across renders without triggering unnecessary reconciliation cycles.
- **Component Communication Patterns:** Implementation of `forwardRef` and `useImperativeHandle` to provide a clean, imperative API for the `ResultModal` component.
- **Optimized UI Rendering:** Utilizing **React Portals** (`createPortal`) to decouple the modal logic from the main application hierarchy, ensuring optimal z-index management and DOM structure.
