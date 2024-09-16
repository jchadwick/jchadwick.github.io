#!/usr/bin/env node

const { chromium } = require('playwright');
const mustache = require('mustache');
const fs = require('fs');
const express = require('express');
const path = require('path');

const port = 8300;
const resumeDir = path.join(__dirname, 'resume');
const resumePdfFile = path.join(__dirname, 'jess-chadwick-resume.pdf');

(async () => {
    await renderWebPage({ pwd: resumeDir });
    const { server, url } = await startWebServer({ port, pwd: resumeDir });
    await generatePdf(url, resumePdfFile);
    server.close();
    process.exit(0);
})();

async function renderWebPage({ pwd }) {
    const template = fs.readFileSync(path.join(pwd, 'resume.hbs'), 'utf-8');
    const data = JSON.parse(fs.readFileSync(path.join(pwd, 'resume.json'), 'utf-8'));
    const htmlContent = mustache.render(template, data);
    fs.writeFileSync(path.join(pwd, 'resume.html'), htmlContent);
}

async function startWebServer({ port, pwd }) {
    const app = express();

    app.use(express.static(pwd));

    const url = `http://localhost:${port}/resume.html`

    const server = app.listen(port, () => {
        console.log(`Server running at ${url}`);
    });

    return { server, url };
}

async function generatePdf(url, outFile) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle'
    });

    await page.pdf({
        path: outFile,
        format: 'A4',

        margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
        }
    });

    // Close the browser
    await browser.close();

    console.log('PDF file generated successfully.');
}