import puppeteer from 'puppeteer';

const profiles = [
    { id: "76561198069883546", name: "Jogador 1" },
    { id: "76561198047160329", name: "Jogador 2" }
];

(async () => {
    const browser = await puppeteer.launch({ headless: true }); // Sempre headless
    const page = await browser.newPage();
    
    let allPlayersData = [];

    for (const profile of profiles) {
        const url = `https://leetify.com/public/profile/${profile.id}`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Aguarda o nome do jogador carregar
        await page.waitForSelector("body > app-root > app-layout > main > app-profile > app-profile-hero > header > div.rank-and-name > h1");

        // Captura o nome do jogador
        const playerName = await page.evaluate(() => {
            return document.querySelector("body > app-root > app-layout > main > app-profile > app-profile-hero > header > div.rank-and-name > h1")?.innerText.trim() || "Desconhecido";
        });

        // Expande os mapas
        const expandButton = "#maps > div.expand-wrapper > button > i";
        await page.waitForSelector(expandButton);
        await page.click(expandButton);

        // Aguarda o carregamento do conteúdo expandido
        await new Promise(resolve => setTimeout(resolve, 2000));

        const extractedData = await page.evaluate(() => {
          const sections = document.querySelectorAll("#maps > div.cards.--expanded > section");
          let results = [];
      
          sections.forEach(section => {
              let winRateElement = section.querySelector(".win-rate app-score-circle-outline svg text");
      
              let sectionData = {
                  mapa: section.querySelector("header h3")?.innerText || "Sem nome",
                  win_rate: winRateElement ? winRateElement.textContent.trim() : "N/A",
                  partidas_jogadas: section.querySelector(".matches-played .value")?.innerText || "N/A",
                  leetify_rating: section.querySelector(".ratings > div:nth-child(1) .value")?.innerText.trim() || "N/A",
                  t_rating: section.querySelector(".ratings > div:nth-child(2) .value")?.innerText.trim() || "N/A",
                  ct_rating: section.querySelector(".ratings > div:nth-child(3) .value")?.innerText.trim() || "N/A"
              };
      
              results.push(sectionData);
          });
      
          return results;
      });

        // Adiciona os dados do jogador no array final
        allPlayersData.push({
            jogador: playerName,
            mapas: extractedData
        });

        console.log(`Dados de ${playerName} extraídos!`);
    }

    console.log("Todos os dados extraídos:", JSON.stringify(allPlayersData, null, 2));

    await browser.close();
})();
