import { Order } from '../order.types';
import { IPrintSetting } from '../../print-setting/print-setting.types';

/**
 * Generates a Base64 encoded SVG string of a thermal receipt.
 * This is a lightweight way to provide a print preview without external dependencies.
 */
export const generateReceiptSvg = (order: Order | any, settings: IPrintSetting['billPrinting']): string => {
  const paperWidth = settings.paperSize === '58mm' ? 300 : 400; // pixels approx
  const padding = 20;
  const fontSize = 14;
  const lineHeight = 20;
  
  let currentY = 40;
  const lines: string[] = [];

  const addText = (text: string, x: number, align: 'start' | 'middle' | 'end' = 'start', isBold = false) => {
    lines.push(`<text x="${x}" y="${currentY}" font-family="monospace" font-size="${fontSize}" fill="black" text-anchor="${align}" ${isBold ? 'font-weight="bold"' : ''}>${escapeHtml(text)}</text>`);
  };

  const addLine = () => {
    lines.push(`<line x1="${padding}" y1="${currentY - 5}" x2="${paperWidth - padding}" y2="${currentY - 5}" stroke="black" stroke-dasharray="4" />`);
    currentY += 10;
  };

  const renderItem = (item: any) => {
    addText(item.itemName || item.name, padding, 'start');
    addText(item.quantity.toString(), paperWidth - padding - 80, 'middle');
    addText((item.totalPrice || 0).toFixed(2), paperWidth - padding, 'end');
    currentY += lineHeight;

    if (item.variationName) {
      addText(`  (${item.variationName})`, padding, 'start');
      currentY += lineHeight;
    }

    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((addon: any) => {
        addText(`  + ${addon.addonItemName || addon.addonName} x${addon.quantity}`, padding, 'start');
        currentY += lineHeight;
      });
    }
  };

  const consolidateItems = (items: any[]) => {
    const map = new Map<string, any>();
    
    items.forEach(item => {
      // Create a unique key for item + variation + addons
      const addonKey = (item.addons || [])
        .map((a: any) => `${a.addonItemId || a.addonId}:${a.quantity}`)
        .sort()
        .join('|');
      const key = `${item.menuItemId}:${item.variationId || ''}:${addonKey}`;
      
      if (map.has(key)) {
        const existing = map.get(key);
        existing.quantity += item.quantity;
        existing.totalPrice += (item.totalPrice || 0);
      } else {
        map.set(key, { ...item });
      }
    });
    
    return Array.from(map.values());
  };

  // 1. Header
  if (settings.showHeader && settings.headerText) {
    addText(settings.headerText, paperWidth / 2, 'middle', true);
    currentY += lineHeight * 1.5;
  }

  // 2. Order Info
  addText(`Order #: ${order.orderNumber}`, padding, 'start', true);
  currentY += lineHeight;
  addText(`Date: ${new Date(order.createdAt).toLocaleString()}`, padding, 'start');
  currentY += lineHeight;
  
  if (settings.showOrderType) {
    const typeStr = order.orderType === 1 ? 'DINE IN' : order.orderType === 2 ? 'TAKEAWAY' : 'DELIVERY';
    addText(`Type: ${typeStr}`, padding, 'start');
    currentY += lineHeight;
  }

  addLine();

  // 3. Items Header
  addText('Item', padding, 'start', true);
  addText('Qty', paperWidth - padding - 80, 'middle', true);
  addText('Price', paperWidth - padding, 'end', true);
  currentY += lineHeight;
  
  addLine();

  // 4. Items List (Consolidated)
  const allItems = order.items || (order.groups ? order.groups.flatMap((g: any) => g.items) : []);
  const aggregatedItems = consolidateItems(allItems);
  aggregatedItems.forEach((item: any) => renderItem(item));

  addLine();

  // 5. Totals
  addText('Subtotal:', paperWidth - padding - 100, 'end');
  addText((order.subtotal || 0).toFixed(2), paperWidth - padding, 'end');
  currentY += lineHeight;

  if (order.discountAmount > 0) {
    addText('Discount:', paperWidth - padding - 100, 'end');
    addText(`-${order.discountAmount.toFixed(2)}`, paperWidth - padding, 'end');
    currentY += lineHeight;
  }

  if (order.taxAmount > 0) {
    addText('Tax:', paperWidth - padding - 100, 'end');
    addText((order.taxAmount || 0).toFixed(2), paperWidth - padding, 'end');
    currentY += lineHeight;
  }

  addText('TOTAL:', paperWidth - padding - 100, 'end', true);
  addText((order.totalAmount || 0).toFixed(2), paperWidth - padding, 'end', true);
  currentY += lineHeight * 1.5;

  // 6. UPI QR Code
  if (settings.showPaymentQrCode && settings.merchantUpiId) {
    addLine();
    addText('Pay via UPI:', paperWidth / 2, 'middle', true);
    currentY += lineHeight;
    addText(settings.merchantUpiId, paperWidth / 2, 'middle');
    currentY += lineHeight * 1.5;
  }

  // 7. Footer
  if (settings.showFooter && settings.footerText) {
    addLine();
    addText(settings.footerText, paperWidth / 2, 'middle');
    currentY += lineHeight;
  }

  const svg = `
<svg width="${paperWidth}" height="${currentY + 20}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  ${lines.join('\n  ')}
</svg>`.trim();

  return Buffer.from(svg).toString('base64');
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
