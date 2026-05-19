import * as QRCode from 'qrcode';

import { IPrintSetting } from '../../print-setting/print-setting.types';
import { Order } from '../order.types';

/**
 * Generates a Base64 encoded SVG string of a thermal receipt.
 * This is a lightweight way to provide a print preview without external dependencies.
 */
export const generateReceiptSvg = async (
  order: Order | any,
  settings: IPrintSetting['billPrinting'],
): Promise<string> => {
  const paperWidth = settings.paperSize === '58mm' ? 300 : 400; // pixels approx
  const padding = 15;
  const fontSize = 12;
  const lineHeight = 18;
  const fontFamily = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const charWidth = fontSize * 0.55; // Approximation for layout calculation
  const maxCharsPerLine = Math.floor((paperWidth - padding * 2) / charWidth);

  // Column Layout
  const colAmount = paperWidth - padding;
  const colPrice = paperWidth - padding - (paperWidth === 300 ? 50 : 65);
  const colQty = colPrice - (paperWidth === 300 ? 55 : 60);
  const itemNameWidth = colQty - padding - 20;
  const itemNameMaxChars = Math.floor(itemNameWidth / charWidth);

  let currentY = 40;
  const lines: string[] = [];

  const addText = (
    text: string,
    x: number,
    align: 'start' | 'middle' | 'end' = 'start',
    isBold = false,
    size = fontSize,
  ) => {
    lines.push(
      `<text x="${x}" y="${currentY}" font-family="${fontFamily}" font-size="${size}" fill="#111" text-anchor="${align}" ${isBold ? 'font-weight="bold"' : ''}>${escapeHtml(text)}</text>`,
    );
  };

  /**
   * Adds text to the SVG, handling both explicit newlines (\n) and automatic word wrapping.
   */
  const addMultiLineText = (
    text: string,
    x: number,
    align: 'start' | 'middle' | 'end' = 'start',
    isBold = false,
    size = fontSize,
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
        if ((currentLine + word).length > maxCharsPerLine) {
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

  const renderItem = (item: any) => {
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
          (remainingLines[remainingLines.length - 1] + word).length > maxCharsPerLine
        ) {
          remainingLines.push(word + ' ');
        } else {
          remainingLines[remainingLines.length - 1] += word + ' ';
        }
      }
    });

    const qtyStr = item.quantity.toString();
    const unitPrice = (item.totalPrice / item.quantity) || 0;
    const priceStr = unitPrice.toFixed(2);
    const amountStr = (item.totalPrice || 0).toFixed(2);

    addText(firstLine.trim(), padding, 'start', true);
    addText(qtyStr, colQty, 'middle');
    addText(priceStr, colPrice, 'end');
    addText(amountStr, colAmount, 'end');
    currentY += lineHeight;

    remainingLines.forEach((line: string) => {
      addText(line.trim(), padding, 'start', true);
      currentY += lineHeight;
    });

    if (item.variationName) {
      addText(`  (${item.variationName})`, padding, 'start');
      currentY += lineHeight;
    }

    if (item.addons && item.addons.length > 0) {
      item.addons.forEach((addon: any) => {
        addText(
          `  + ${addon.addonItemName || addon.addonName} x${addon.quantity}`,
          padding,
          'start',
        );
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
        existing.totalPrice += item.totalPrice || 0;
      } else {
        map.set(key, { ...item });
      }
    });

    return Array.from(map.values());
  };

  // 1. Header
  if (settings.showHeader && settings.headerText) {
    addMultiLineText(settings.headerText, paperWidth / 2, 'middle', true, fontSize + 2);
    currentY += 5;
  }

  // 2. Order Info
  addLine();

  const dateObj = new Date(order.createdAt);
  const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear().toString().slice(-2)} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  
  addText(`Date: ${dateStr}`, padding, 'start');
  
  if (settings.showOrderType) {
    const typeStr =
      order.orderType === 1 ? 'Dine In' : order.orderType === 2 ? 'Takeaway' : 'Delivery';
    let typeDisplay = typeStr;
    if (order.orderType === 1 && order.tableId && typeof order.tableId === 'object') {
      typeDisplay += `: ${order.tableId.name || 'N/A'}`;
    }
    addText(typeDisplay, paperWidth - padding, 'end', true);
  }
  currentY += lineHeight;

  let hasNextRow = false;
  if (order.waiterId && typeof order.waiterId === 'object' && settings.showCaptainName) {
    addText(`Cashier: ${order.waiterId.name || 'N/A'}`, padding, 'start');
    hasNextRow = true;
  }

  if (order.tokenNo) {
    addText(`Bill No.: ${order.tokenNo}`, paperWidth - padding, 'end');
    hasNextRow = true;
  }
  
  if (hasNextRow) {
      currentY += lineHeight;
  }

  // Customer Info
  const customer = order.customerId;
  if (customer && typeof customer === 'object' && settings.showCustomerDetails) {
    addLine();
    addText(`Name: ${customer.name || ''}`, padding, 'start');
    currentY += lineHeight;
    if (customer.mobile) {
      addText(`Mobile: ${customer.mobile}`, padding, 'start');
      currentY += lineHeight;
    }
  }

  addLine();

  // 3. Items Header
  addText('Item', padding, 'start', true);
  addText('Qty.', colQty, 'middle', true);
  addText('Price', colPrice, 'end', true);
  addText('Amount', colAmount, 'end', true);
  currentY += lineHeight;

  addLine();

  // 4. Items List (Consolidated)
  const allItems = order.items || (order.groups ? order.groups.flatMap((g: any) => g.items) : []);
  const aggregatedItems = consolidateItems(allItems);
  aggregatedItems.forEach((item: any) => renderItem(item));

  addLine();

  // 5. Totals
  const totalQty = aggregatedItems.reduce((sum, item) => sum + item.quantity, 0);

  addText(`Total Qty: ${totalQty}`, colQty - 20, 'end', true);
  addText('Sub Total', colPrice, 'end', true);
  addText((order.subtotal || 0).toFixed(2), colAmount, 'end', true);
  currentY += lineHeight;

  if (order.discountAmount > 0) {
    addText('Discount', colPrice, 'end', true);
    addText(`-${order.discountAmount.toFixed(2)}`, colAmount, 'end', true);
    currentY += lineHeight;
  }

  if (order.taxAmount > 0 && settings.showTax !== false) {
    if (order.taxBreakup && order.taxBreakup.length > 0) {
      order.taxBreakup.forEach((tax: any) => {
        let taxName = tax.name;
        if (tax.type === 'PERCENTAGE' && !taxName.includes('%')) {
          taxName += ` ${tax.rate}%`;
        }
        addText(taxName, colPrice, 'end');
        addText((tax.taxAmount || 0).toFixed(2), colAmount, 'end');
        currentY += lineHeight;
      });
    } else {
      addText('Tax', colPrice, 'end');
      addText((order.taxAmount || 0).toFixed(2), colAmount, 'end');
      currentY += lineHeight;
    }
  }

  addLine();

  addText(`Grand Total  ₹ ${(order.totalAmount || 0).toFixed(2)}`, colAmount, 'end', true, fontSize + 2);
  currentY += lineHeight * 1.5;

  // 6. UPI QR Code
  if (settings.showPaymentQrCode && settings.merchantUpiId) {
    addLine();
    addText('Scan to Pay via UPI', paperWidth / 2, 'middle', true);
    currentY += 10;

    const upiUrl = `upi://pay?pa=${settings.merchantUpiId}&pn=Restaurant&am=${order.totalAmount}&cu=INR`;
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 120 });
      lines.push(
        `<image x="${(paperWidth - 120) / 2}" y="${currentY}" width="120" height="120" href="${qrDataUrl}" />`,
      );
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
    addMultiLineText(settings.footerText, paperWidth / 2, 'middle', true, fontSize + 1);
  }

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

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
