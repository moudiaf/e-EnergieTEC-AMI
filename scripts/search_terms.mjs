import fs from 'fs';

const content = fs.readFileSync('C:/Users/SMLLTP/.gemini/antigravity/brain/da35f4ed-d27d-4526-acb4-5fa0f27f9760/scratch/decompressed_pdf.txt', 'latin1');
const terms = ['enquiry', 'inquiry', 'short code', 'keypad', 'keyboard', 'LCD', '801', '804', '807', '814', '001', '070', 'total active', 'consumption'];

for (const t of terms) {
  let idx = 0;
  let count = 0;
  while ((idx = content.indexOf(t, idx)) !== -1) {
    count++;
    if (count <= 2) {
      const snippet = content.substring(Math.max(0, idx - 60), Math.min(content.length, idx + 120));
      console.log(`[${t} #${count}] ` + snippet.replace(/[\r\n\t]+/g, ' '));
    }
    idx += t.length;
  }
}
