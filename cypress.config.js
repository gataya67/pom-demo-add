import { defineConfig } from "cypress";

export default defineConfig({
  screenshotsFolder: "public/tempScreenshots",
  videosFolder: "cypress/videos",
  video: false,

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
  },
});