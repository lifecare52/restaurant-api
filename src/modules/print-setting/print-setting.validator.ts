import Joi from 'joi';

export const printSettingValidator = {
  updateSetting: Joi.object({
    billPrinting: Joi.object({
      isEnabled: Joi.boolean(),
      autoPrintOnSettlement: Joi.boolean(),
      paperSize: Joi.string().valid('58mm', '80mm'),
      printMode: Joi.string().valid('SILENT', 'PREVIEW'),
      printerName: Joi.string().allow('', null),
      header: Joi.object({
        showLogo: Joi.boolean(),
        restaurantName: Joi.string().allow('', null),
        address: Joi.string().allow('', null),
        contactNumber: Joi.string().allow('', null),
        taxNumber: Joi.string().allow('', null)
      }),
      footer: Joi.object({
        thankYouMessage: Joi.string().allow('', null),
        termsAndConditions: Joi.string().allow('', null)
      }),
      showQRCode: Joi.boolean(),
      numberOfCopies: Joi.number().integer().min(1).max(5)
    }),
    kotPrinting: Joi.object({
      isEnabled: Joi.boolean(),
      autoPrintOnGeneration: Joi.boolean(),
      paperSize: Joi.string().valid('58mm', '80mm'),
      printMode: Joi.string().valid('SILENT', 'PREVIEW'),
      printerName: Joi.string().allow('', null),
      showOrderType: Joi.boolean(),
      showWaiterName: Joi.boolean()
    })
  })
};
