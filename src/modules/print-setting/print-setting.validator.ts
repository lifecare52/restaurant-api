import Joi from 'joi';

export const printSettingValidator = {
  updateSetting: Joi.object({
    billPrinting: Joi.object({
      isEnabled: Joi.boolean(),
      autoPrintOnSettlement: Joi.boolean(),
      paperSize: Joi.string().valid('58mm', '80mm'),
      printMode: Joi.string().valid('SILENT', 'PREVIEW'),
      printerName: Joi.string().allow('', null),
      
      showLogo: Joi.boolean(),
      showHeader: Joi.boolean(),
      headerText: Joi.string().allow('', null),
      showFooter: Joi.boolean(),
      footerText: Joi.string().allow('', null),
      
      showCustomerDetails: Joi.boolean(),
      showCaptainName: Joi.boolean(),
      showCoverCount: Joi.boolean(),
      showItemHsnCode: Joi.boolean(),
      showDiscountDetails: Joi.boolean(),
      
      showPaymentQrCode: Joi.boolean(),
      merchantUpiId: Joi.string().allow('', null),
      showOrderType: Joi.boolean(),
      
      numberOfCopies: Joi.number().integer().min(1).max(5)
    }),
    kotPrinting: Joi.object({
      isEnabled: Joi.boolean(),
      autoPrintOnGeneration: Joi.boolean(),
      paperSize: Joi.string().valid('58mm', '80mm'),
      printMode: Joi.string().valid('SILENT', 'PREVIEW'),
      printerName: Joi.string().allow('', null),
      
      showModifiers: Joi.boolean(),
      itemWiseKOT: Joi.boolean(),
      showCancelledItems: Joi.boolean(),
      showTableToken: Joi.boolean(),
      showWaiterName: Joi.boolean(),
      showOrderType: Joi.boolean(),
      showCoverCount: Joi.boolean()
    })
  })
};
