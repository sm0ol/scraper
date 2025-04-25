import { JSDOM } from 'jsdom';

const dom = await JSDOM.fromURL('https://jacksonswash.com/');
const { document } = dom.window;

// Remove script and style elements
document.querySelectorAll('script, style').forEach(el => el.remove());

// Remove common boilerplate/navigation elements
document.querySelectorAll('header, nav, footer').forEach(el => el.remove());

// Get text content from the body
let relevantText = document.body.textContent || "";

// Optional: Clean up whitespace (remove excessive newlines and trim)
relevantText = relevantText.replace(/\s+/g, ' ').trim();

console.log(relevantText);
