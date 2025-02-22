import express from "express";
import puppeteer from "puppeteer";

const app = express();
const PORT = 3000;
app.use(express.static("public"));

app.get("/response", async (req, res) => {
    // player's ids that will have their data fetched
    const profiles = [
        { id: "76561198069883546", name: "Lks8" },
        { id: "76561198047160329", name: "Noob" },
        { id: "76561199035813483", name: "Bob" },
        { id: "76561199405152849", name: "Edy" },
        { id: "76561198063283230", name: "Pira" },
        { id: "76561198025516757", name: "Fer" },
        { id: "76561198117725021", name: "Toninho" }
    ];

    // start puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let allPlayersData = [];

    for (const profile of profiles) {
        // access player's public profile on leetify
        const url = `https://leetify.com/public/profile/${profile.id}`;
        await page.goto(url, { waitUntil: "networkidle2" });

        // selects the player's name from the page
        await page.waitForSelector("body > app-root > app-layout > main > app-profile > app-profile-hero > header > div.rank-and-name > h1");
        const playerName = await page.evaluate(() => {
            return document.querySelector("body > app-root > app-layout > main > app-profile > app-profile-hero > header > div.rank-and-name > h1")?.innerText.trim() || "Not found";
        });

        // expands list of maps played
        const expandButton = "#maps > div.expand-wrapper > button > i";
        await page.waitForSelector(expandButton);
        await page.click(expandButton);

        // current active map rotation of CS2
        const activeMaps = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Train", "Dust2"];

        const extractedData = await page.evaluate(() => {
            // finds the expanded section of maps played
            const sections = document.querySelectorAll("#maps > div.cards.--expanded > section");
            let results = [];

            sections.forEach(section => {
                // finds the player's winrate
                let winRateElement = section.querySelector(".win-rate app-score-circle-outline svg text");

                // maps all data from player
                let sectionData = {
                    map: section.querySelector("header h3")?.innerText || "Map not found",
                    win_rate: winRateElement ? winRateElement.textContent.trim() : "N/A",
                    matches_played: section.querySelector(".matches-played .value")?.innerText || "N/A",
                    leetify_rating: section.querySelector(".ratings > div:nth-child(1) .value")?.innerText.trim() || "N/A",
                    t_rating: section.querySelector(".ratings > div:nth-child(2) .value")?.innerText.trim() || "N/A",
                    ct_rating: section.querySelector(".ratings > div:nth-child(3) .value")?.innerText.trim() || "N/A"
                };

                results.push(sectionData);
            });

            return results;
        });

        const activeRotationData = extractedData.filter(map => activeMaps.includes(map.map));

        allPlayersData.push({
            playerName: playerName,
            stats: activeRotationData
        });

        console.log(playerName + "'s data was succesfully loaded!");
    }
    await browser.close();
    res.json(allPlayersData);

    console.log("Data sent!");
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}, go to http://localhost:${PORT}/response for the full JSON`));
