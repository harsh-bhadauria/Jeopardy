# Jeopardy Board Builder + Host

I wanted a clean, hassle-free way to build and host Jeopardy games for game nights with friends. Unfortunately, almost every existing online tool I tried was bogged down by frustrating, arbitrary limitations- caps on the number of images you can upload, locked column counts, clunky interfaces, or paywalls for basic features. 

So, I built my own. This is a completely free, client-side, zero-restriction Jeopardy editor and hosting interface designed to run entirely in your browser. Enjoy!


## Why this is different

* **Zero Limitations:** Create as many categories (columns) and clue tiers (rows) as your screen can handle. No paywalls, no limits.
* **Portable Self-Contained Files:** Upload as many images as you want into your clues. They are automatically optimized, converted to Base64, and saved directly into the board's JSON structure. You get a single, lightweight file containing your entire game-ready to share or move anywhere.
* **A Host-First Interface:** When it's game time, the host gets a full-viewport board layout, complete with fade-ins and smooth modal transitions.
* **Active HUD Scoring:** Scorecards float securely at the bottom of the viewport using pointer-events so they never block cell clicks underneath. You can change player names and edit scores on the fly.


## How to Play

1. **Build:** Create a board from scratch, add categories, assign point values, write clues, and embed images.
2. **Save:** Export your board as a `.json` file to your computer.
3. **Host:** Import the JSON on game night, set your players, and start hosting.


## Development and Setup

### Prerequisites
Make sure you have Node.js (v18 or higher) and npm installed.

### Installation
```bash
git clone git@github.com:harsh-bhadauria/Jeopardy.git
cd Jeopardy
npm install
```

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```
This compiles the optimized production assets into the `dist/` directory, ready to be hosted on any static hosting provider.

<h1></h1>
~ Made with ♥️ by Harsh
