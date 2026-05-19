import { IPrintSetting } from '../../print-setting/print-setting.types';
import { Order } from '../order.types';

/**
 * Generates a Base64 encoded SVG string of a KOT (Kitchen Order Token).
 */
export const generateKOTSvg = async (
  order: any,
  items: any[],
  settings: IPrintSetting['kotPrinting'],
  isVoid: boolean = false,
): Promise<string[]> => {
  const paperWidth = settings.paperSize === '58mm' ? 300 : 400;
  const padding = 15;
  const fontSize = 12;
  const lineHeight = 18;
  const fontFamily = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const charWidth = fontSize * 0.55;
  const maxCharsPerLine = Math.floor((paperWidth - padding * 2) / charWidth);
  
  const colQty = paperWidth - padding;
  const itemNameWidth = colQty - padding - 40;
  const itemNameMaxChars = Math.floor(itemNameWidth / charWidth);

  const generateSingleSvg = (kotItems: any[], kotLabel?: string) => {
    let currentY = 40;
    const lines: string[] = [];

    const addText = (
      text: string,
      x: number,
      align: 'start' | 'middle' | 'end' = 'start',
      isBold = false,
      customSize?: number,
    ) => {
      lines.push(
        `<text x="${x}" y="${currentY}" font-family="${fontFamily}" font-size="${customSize || fontSize}" fill="#111" text-anchor="${align}" ${isBold ? 'font-weight="bold"' : ''}>${escapeHtml(text)}</text>`,
      );
    };

    const addMultiLineText = (
      text: string,
      x: number,
      align: 'start' | 'middle' | 'end' = 'start',
      isBold = false,
      size = fontSize,
      maxWidthChars = maxCharsPerLine
    ) => {
      if (!text) return;
      const explicitLines = text.split(/\r?\n/);
      explicitLines.forEach((line: string) => {
        if (!line.trim()) {
          currentY += lineHeight;
          return;
        }
        const words = line.split(' ');
        let currentLine = '';
        words.forEach((word: string) => {
          if ((currentLine + word).length > maxWidthChars) {
            addText(currentLine.trim(), x, align, isBold, size);
            currentY += lineHeight;
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        if (currentLine.trim()) {
          addText(currentLine.trim(), x, align, isBold, size);
          currentY += lineHeight;
        }
      });
    };

    const addLine = () => {
      lines.push(
        `<line x1="${padding}" y1="${currentY - 5}" x2="${paperWidth - padding}" y2="${currentY - 5}" stroke="#555" stroke-width="1" />`,
      );
      currentY += 10;
    };

    // 1. VOID / CANCELLED Header
    if (isVoid) {
      addText('*** VOID KOT ***', paperWidth / 2, 'middle', true, 20);
      currentY += lineHeight + 5;
      addText('ITEMS CANCELLED', paperWidth / 2, 'middle', true, 16);
      currentY += lineHeight + 10;
    } else {
      addText('KOT', paperWidth / 2, 'middle', true, 22);
      currentY += lineHeight + 10;
    }

    // 2. Metadata
    if (settings.showTableToken) {
      if (order.tableId && typeof order.tableId === 'object') {
        addText(`TABLE: ${order.tableId.name}`, padding, 'start', true, 16);
      } else if (order.tokenNo) {
        addText(`TOKEN: ${order.tokenNo}`, padding, 'start', true, 16);
      }
      currentY += lineHeight;
    }

    if (settings.showOrderType) {
      const typeStr =
        order.orderType === 1 ? 'DINE IN' : order.orderType === 2 ? 'TAKEAWAY' : 'DELIVERY';
      addText(`Type: ${typeStr}`, padding, 'start');
      currentY += lineHeight;
    }

    if (settings.showWaiterName && order.waiterId && typeof order.waiterId === 'object') {
      addText(`Captain: ${order.waiterId.name}`, padding, 'start');
      currentY += lineHeight;
    }

    addText(`Date: ${new Date().toLocaleString()}`, padding, 'start');
    currentY += lineHeight;

    if (order.notes) {
      addLine();
      const notesSize = fontSize + 2;
      const notesMaxChars = Math.floor((paperWidth - padding * 2) / (notesSize * 0.55));
      addMultiLineText(`Notes: ${order.notes}`, padding, 'start', true, notesSize, notesMaxChars);
    }

    addLine();

    // 3. Items
    addText('ITEM', padding, 'start', true);
    addText('QTY', paperWidth - padding, 'end', true);
    currentY += lineHeight;
    addLine();

    kotItems.forEach((item: any) => {
      const name = item.itemName || item.name;
      const words = name.split(' ');
      let firstLine = '';
      let remainingLines: string[] = [];

      words.forEach((word: string) => {
        if (!remainingLines.length && (firstLine + word).length <= itemNameMaxChars) {
          firstLine += word + ' ';
        } else {
          if (
            !remainingLines.length ||
            (remainingLines[remainingLines.length - 1] + word).length > itemNameMaxChars
          ) {
            remainingLines.push(word + ' ');
          } else {
            remainingLines[remainingLines.length - 1] += word + ' ';
          }
        }
      });

      addText(firstLine.trim(), padding, 'start', true, fontSize + 2);
      addText(item.quantity.toString() + 'x', colQty, 'end', true, fontSize + 4);
      currentY += lineHeight;

      remainingLines.forEach((line: string) => {
        addText(line.trim(), padding, 'start', true, fontSize + 2);
        currentY += lineHeight;
      });

      if (item.variationName) {
        addMultiLineText(`  (${item.variationName})`, padding, 'start');
      }

      if (settings.showModifiers && item.addons && item.addons.length > 0) {
        item.addons.forEach((addon: any) => {
          addMultiLineText(`  + ${addon.addonItemName || addon.addonName}`, padding, 'start');
        });
      }

      if (settings.showModifiers && item.instruction) {
        addMultiLineText(`  Note: ${item.instruction}`, padding, 'start');
      }

      currentY += 5; // spacing between items
    });

    addLine();
    addText('--- End of KOT ---', paperWidth / 2, 'middle');
    currentY += 20;

    const svg = `
<svg width="${paperWidth}" height="${currentY + 20}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
    </style>
  </defs>
  <rect width="100%" height="100%" fill="white" />
  ${lines.join('\n  ')}
</svg>`.trim();

    return Buffer.from(svg).toString('base64');
  };

  const consolidateItems = (items: any[]) => {
    const map = new Map<string, any>();

    items.forEach((item: any) => {
      const addonKey = (item.addons || [])
        .map((a: any) => `${a.addonItemId || a.addonId}:${a.quantity}`)
        .sort()
        .join('|');
      const key = `${item.menuItemId || item._id}:${item.variationId || ''}:${addonKey}`;

      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += item.quantity;
      } else {
        map.set(key, { ...item });
      }
    });

    return Array.from(map.values());
  };

  // Logic for Item-wise KOT
  if (settings.itemWiseKOT) {
    const svgs: string[] = [];
    items.forEach(item => {
      // Create a separate SVG for each item
      svgs.push(generateSingleSvg([item]));
    });
    return svgs;
  } else {
    // Single consolidated KOT
    const aggregatedItems = consolidateItems(items);
    return [generateSingleSvg(aggregatedItems)];
  }
};

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
