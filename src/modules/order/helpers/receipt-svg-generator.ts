import { Order } from '../order.types';
import { IPrintSetting } from '../../print-setting/print-setting.types';
import * as QRCode from 'qrcode';

/**
 * Generates a Base64 encoded SVG string of a thermal receipt.
 * This is a lightweight way to provide a print preview without external dependencies.
 */
export const generateReceiptSvg = async (order: Order | any, settings: IPrintSetting['billPrinting']): Promise<string> => {
  const paperWidth = settings.paperSize === '58mm' ? 300 : 400; // pixels approx
  const padding = 20;
  const fontSize = 14;
  const lineHeight = 20;
  const fontFamily = "'Poppins', sans-serif";
  const charWidth = fontSize * 0.6; // Approximation for layout calculation
  const maxCharsPerLine = Math.floor((paperWidth - padding * 2) / charWidth);
  
  let currentY = 40;
  const lines: string[] = [];

  const addText = (text: string, x: number, align: 'start' | 'middle' | 'end' = 'start', isBold = false) => {
    lines.push(`<text x="${x}" y="${currentY}" font-family="${fontFamily}" font-size="${fontSize}" fill="black" text-anchor="${align}" ${isBold ? 'font-weight="bold"' : ''}>${escapeHtml(text)}</text>`);
  };

  /**
   * Adds text to the SVG, handling both explicit newlines (\n) and automatic word wrapping.
   */
  const addMultiLineText = (text: string, x: number, align: 'start' | 'middle' | 'end' = 'start', isBold = false) => {
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
        if ((currentLine + word).length > maxCharsPerLine) {
          addText(currentLine.trim(), x, align, isBold);
          currentY += lineHeight;
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
      
      if (currentLine.trim()) {
        addText(currentLine.trim(), x, align, isBold);
        currentY += lineHeight;
      }
    });
  };

  const addLine = () => {
    lines.push(`<line x1="${padding}" y1="${currentY - 5}" x2="${paperWidth - padding}" y2="${currentY - 5}" stroke="black" stroke-dasharray="4" />`);
    currentY += 10;
  };

  const renderItem = (item: any) => {
    const name = item.itemName || item.name;
    const words = name.split(' ');
    let firstLine = '';
    let remainingLines: string[] = [];
    
    const firstLineMax = maxCharsPerLine - 15; 

    words.forEach((word: string) => {
      if (!remainingLines.length && (firstLine + word).length <= firstLineMax) {
        firstLine += word + ' ';
      } else {
        if (!remainingLines.length || (remainingLines[remainingLines.length - 1] + word).length > maxCharsPerLine) {
          remainingLines.push(word + ' ');
        } else {
          remainingLines[remainingLines.length - 1] += word + ' ';
        }
      }
    });

    addText(firstLine.trim(), padding, 'start');
    addText(item.quantity.toString(), paperWidth - padding - 80, 'middle');
    addText((item.totalPrice || 0).toFixed(2), paperWidth - padding, 'end');
    currentY += lineHeight;

    remainingLines.forEach((line: string) => {
      addText(line.trim(), padding, 'start');
      currentY += lineHeight;
    });

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
    
    items.forEach((item: any) => {
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
    addMultiLineText(settings.headerText, paperWidth / 2, 'middle', true);
    currentY += 10;
  }

  // 2. Order Info

  // Customer Info
  const customer = order.customerId;
  if (customer && typeof customer === 'object' && settings.showCustomerDetails) {
    addText(`Customer: ${customer.name || 'N/A'}`, padding, 'start');
    currentY += lineHeight;
    if (customer.mobile) {
      addText(`Mobile: ${customer.mobile}`, padding, 'start');
      currentY += lineHeight;
    }
  }

  if (order.tokenNo) {
    addText(`Token No: ${order.tokenNo}`, padding, 'start', true);
    currentY += lineHeight;
  }

  addText(`Date: ${new Date(order.createdAt).toLocaleString()}`, padding, 'start');
  currentY += lineHeight;
  
  if (settings.showOrderType) {
    const typeStr = order.orderType === 1 ? 'DINE IN' : order.orderType === 2 ? 'TAKEAWAY' : 'DELIVERY';
    addText(`Type: ${typeStr}`, padding, 'start');
    currentY += lineHeight;

    if (order.orderType === 1 && order.tableId && typeof order.tableId === 'object') {
      addText(`Table: ${order.tableId.name || 'N/A'}`, padding, 'start');
      currentY += lineHeight;
    }
  }

  if (order.waiterId && typeof order.waiterId === 'object' && settings.showCaptainName) {
    addText(`Waiter: ${order.waiterId.name || 'N/A'}`, padding, 'start');
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
    addText('Scan to Pay via UPI:', paperWidth / 2, 'middle', true);
    currentY += 10;
    
    const upiUrl = `upi://pay?pa=${settings.merchantUpiId}&pn=Restaurant&am=${order.totalAmount}&cu=INR`;
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 120 });
      lines.push(`<image x="${(paperWidth - 120) / 2}" y="${currentY}" width="120" height="120" href="${qrDataUrl}" />`);
      currentY += 130;
    } catch (err) {
      console.error('QR Generation failed', err);
      addText(settings.merchantUpiId, paperWidth / 2, 'middle');
      currentY += lineHeight;
    }
  }

  // 7. Footer
  if (settings.showFooter && settings.footerText) {
    addLine();
    addMultiLineText(settings.footerText, paperWidth / 2, 'middle');
  }

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

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
