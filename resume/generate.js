#!/bin/env node

const { chromium } = require('playwright');
const mustache = require('mustache');
const fs = require('fs');

(async () => {
    const template = fs.readFileSync('resume.hbs', 'utf-8');
    const data = JSON.parse(fs.readFileSync('resume.json', 'utf-8'));

    const htmlContent = mustache.render(template, data);

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    // Ensure all images and scripts are loaded
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.pdf({
        path: 'resume.pdf',
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
})();