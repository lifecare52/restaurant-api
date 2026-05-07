import { Order } from '../order.types';
import { IPrintSetting } from '../../print-setting/print-setting.types';

/**
 * Generates a Base64 encoded SVG string of a KOT (Kitchen Order Token).
 */
export const generateKOTSvg = async (
  order: any,
  items: any[],
  settings: IPrintSetting['kotPrinting'],
  isVoid: boolean = false
): Promise<string[]> => {
  const paperWidth = settings.paperSize === '58mm' ? 300 : 400;
  const padding = 20;
  const fontSize = 14;
  const lineHeight = 22;
  const fontFamily = "'Poppins', sans-serif";
  const charWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor((paperWidth - padding * 2) / charWidth);

  const generateSingleSvg = (kotItems: any[], kotLabel?: string) => {
    let currentY = 40;
    const lines: string[] = [];

    const addText = (text: string, x: number, align: 'start' | 'middle' | 'end' = 'start', isBold = false, customSize?: number) => {
      lines.push(`<text x="${x}" y="${currentY}" font-family="${fontFamily}" font-size="${customSize || fontSize}" fill="black" text-anchor="${align}" ${isBold ? 'font-weight="bold"' : ''}>${escapeHtml(text)}</text>`);
    };

    const addLine = () => {
      lines.push(`<line x1="${padding}" y1="${currentY - 5}" x2="${paperWidth - padding}" y2="${currentY - 5}" stroke="black" stroke-dasharray="4" />`);
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
      const typeStr = order.orderType === 1 ? 'DINE IN' : order.orderType === 2 ? 'TAKEAWAY' : 'DELIVERY';
      addText(`Type: ${typeStr}`, padding, 'start');
      currentY += lineHeight;
    }

    if (settings.showWaiterName && order.waiterId && typeof order.waiterId === 'object') {
      addText(`Captain: ${order.waiterId.name}`, padding, 'start');
      currentY += lineHeight;
    }

    addText(`Date: ${new Date().toLocaleString()}`, padding, 'start');
    currentY += lineHeight;

    addLine();

    // 3. Items
    addText('ITEM', padding, 'start', true);
    addText('QTY', paperWidth - padding, 'end', true);
    currentY += lineHeight;
    addLine();

    kotItems.forEach((item: any) => {
      const name = item.itemName || item.name;
      addText(name, padding, 'start', true);
      addText(item.quantity.toString(), paperWidth - padding, 'end', true, 18);
      currentY += lineHeight;

      if (item.variationName) {
        addText(`  (${item.variationName})`, padding, 'start');
        currentY += lineHeight;
      }

      if (settings.showModifiers && item.addons && item.addons.length > 0) {
        item.addons.forEach((addon: any) => {
          addText(`  + ${addon.addonItemName || addon.addonName}`, padding, 'start');
          currentY += lineHeight;
        });
      }

      if (settings.showModifiers && item.instruction) {
        addText(`  Note: ${item.instruction}`, padding, 'start');
        currentY += lineHeight;
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
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&amp;display=swap');
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
